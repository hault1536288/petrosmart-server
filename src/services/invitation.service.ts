import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invitation, InvitationStatus } from '../entity/invitation.entity';
import { CreateInvitationDto, InvitationResponseDto } from '../dtos/invitation.dto';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  ResourceNotFoundException,
  ExpiredException,
  DuplicateResourceException,
} from '../exceptions/custom-exceptions';
import { RoleType } from '../entity/roles.entity';
import { EmailService } from './email.service';
import { UserService } from './user.service';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private configService: ConfigService,
    private emailService: EmailService,
    private userService: UserService,
  ) {}

  /**
   * Generate a unique token for invitation
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create an invitation
   */
  async createInvitation(
    createInvitationDto: CreateInvitationDto,
    inviterId: number,
    sendEmail: boolean = false,
  ): Promise<InvitationResponseDto> {
    // Check if there's already a pending invitation for this email and role
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        email: createInvitationDto.email,
        roleType: createInvitationDto.roleType,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation && new Date() < existingInvitation.expiresAt) {
      throw new DuplicateResourceException(
        'An active invitation already exists for this email',
        'email',
      );
    }

    // Generate unique token
    const token = this.generateToken();

    // Set expiration (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        (parseInt(this.configService.get('INVITATION_EXPIRY_DAYS') || '7')),
    );

    // Create invitation
    const invitation = this.invitationRepository.create({
      token,
      email: createInvitationDto.email,
      roleType: createInvitationDto.roleType,
      stationId: createInvitationDto.stationId,
      expiresAt,
      invitedBy: inviterId,
      status: InvitationStatus.PENDING,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Generate invitation link
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const invitationLink = `${frontendUrl}/register/staff?token=${token}`;

    // Send email if requested
    if (sendEmail) {
      try {
        const inviter = await this.userService.findOne(inviterId);
        const inviterName = inviter
          ? `${inviter.firstName} ${inviter.lastName}`
          : 'Your administrator';

        await this.emailService.sendInvitation(
          createInvitationDto.email,
          invitationLink,
          createInvitationDto.roleType,
          inviterName,
          expiresAt,
        );
      } catch (error) {
        // Log error but don't fail the invitation creation
        console.error('Failed to send invitation email:', error);
      }
    }

    return {
      id: savedInvitation.id,
      token: savedInvitation.token,
      email: savedInvitation.email,
      roleType: savedInvitation.roleType,
      stationId: savedInvitation.stationId,
      expiresAt: savedInvitation.expiresAt,
      invitationLink,
    };
  }

  /**
   * Validate an invitation token
   */
  async validateInvitation(token: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new ResourceNotFoundException('Invitation');
    }

    // Check if already accepted
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new ExpiredException('Invitation has already been used');
    }

    // Check if revoked
    if (invitation.status === InvitationStatus.REVOKED) {
      throw new ExpiredException('Invitation has been revoked');
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new ExpiredException('Invitation');
    }

    return invitation;
  }

  /**
   * Mark invitation as accepted
   */
  async markAsAccepted(token: string, userId: number): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (invitation) {
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedAt = new Date();
      invitation.acceptedBy = userId;
      await this.invitationRepository.save(invitation);
    }
  }

  /**
   * Get all invitations (with optional filters)
   */
  async findAll(status?: InvitationStatus): Promise<Invitation[]> {
    if (status) {
      return this.invitationRepository.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });
    }
    return this.invitationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get invitation by ID
   */
  async findOne(id: number): Promise<Invitation | null> {
    return this.invitationRepository.findOne({ where: { id } });
  }

  /**
   * Get invitation by token
   */
  async findByToken(token: string): Promise<Invitation | null> {
    return this.invitationRepository.findOne({ where: { token } });
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(id: number): Promise<void> {
    const invitation = await this.findOne(id);
    if (!invitation) {
      throw new ResourceNotFoundException('Invitation');
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new Error('Cannot revoke an accepted invitation');
    }

    invitation.status = InvitationStatus.REVOKED;
    await this.invitationRepository.save(invitation);
  }

  /**
   * Delete expired invitations (cleanup task)
   */
  async deleteExpiredInvitations(): Promise<number> {
    const result = await this.invitationRepository.delete({
      expiresAt: LessThan(new Date()),
      status: InvitationStatus.PENDING,
    });

    return result.affected || 0;
  }

  /**
   * Resend invitation (generate new token)
   */
  async resendInvitation(
    id: number,
    inviterId: number,
    sendEmail: boolean = false,
  ): Promise<InvitationResponseDto> {
    const oldInvitation = await this.findOne(id);
    if (!oldInvitation) {
      throw new ResourceNotFoundException('Invitation');
    }

    // Revoke old invitation
    await this.revokeInvitation(id);

    // Create new invitation
    return this.createInvitation(
      {
        email: oldInvitation.email,
        roleType: oldInvitation.roleType,
        stationId: oldInvitation.stationId,
      },
      inviterId,
      sendEmail,
    );
  }
}


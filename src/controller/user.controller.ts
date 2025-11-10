import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/decorators/check-policies.decorator';
import { Action, AppAbility } from '../casl/casl-ability.factory';
import { User } from '../entity/user.entity';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { UserService } from 'src/services/user.service';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { UpdateUserDto } from 'src/dtos/update-user.dto';
import { CreateAdminDto } from 'src/dtos/create-admin.dto';
import { CreateStaffDto } from 'src/dtos/create-staff.dto';
import { RoleType } from '../entity/roles.entity';
import { InvitationService } from '../services/invitation.service';
import { CreateInvitationDto } from '../dtos/invitation.dto';
import { InvitationStatus } from '../entity/invitation.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private caslAbilityFactory: CaslAbilityFactory,
    private invitationService: InvitationService,
  ) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async findAll(@Request() req) {
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Read, User) as boolean) {
      throw new ForbiddenException('Cannot read users');
    }

    return this.userService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async findOne(@Param('id') id: string, @Request() req) {
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Read, User) as boolean) {
      throw new ForbiddenException('Cannot read this user');
    }
    return this.userService.findOne(+id);
  }

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, User))
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const user = await this.userService.findOne(+id);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Update, user!) as boolean) {
      throw new ForbiddenException('Cannot update this user');
    }

    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, User))
  async remove(@Param('id') id: string, @Request() req) {
    const user = await this.userService.findOne(+id);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot(Action.Delete, user!) as boolean) {
      throw new ForbiddenException('Cannot delete this user');
    }

    await this.userService.remove(+id);
    return { message: 'User deleted successfully' };
  }

  /**
   * Create an Admin account
   * Only accessible by Super Admins
   */
  @Post('admin')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, User))
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @Request() req) {
    // Check if user is Super Admin
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins can create admin accounts',
      );
    }

    const admin = await this.userService.createAdmin(createAdminDto);

    return {
      message: 'Admin account created successfully',
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    };
  }

  /**
   * Create a Staff account
   * Accessible by Super Admins and Admins
   */
  @Post('staff')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, User))
  async createStaff(@Body() createStaffDto: CreateStaffDto, @Request() req) {
    // Check if user is Super Admin or Admin
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN && userRole !== RoleType.ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins and Admins can create staff accounts',
      );
    }

    const staff = await this.userService.createStaff(createStaffDto);

    return {
      message: 'Staff account created successfully',
      user: {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
      },
    };
  }

  /**
   * Generate an invitation link for staff
   * Accessible by Super Admins and Admins
   */
  @Post('invitations')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, User))
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req,
    @Query('sendEmail') sendEmail?: string,
  ) {
    // Check if user is Super Admin or Admin
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN && userRole !== RoleType.ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins and Admins can create invitations',
      );
    }

    // Validate role type - Admins can only invite Staff
    if (
      userRole === RoleType.ADMIN &&
      (createInvitationDto.roleType === RoleType.SUPER_ADMIN ||
        createInvitationDto.roleType === RoleType.ADMIN)
    ) {
      throw new UnauthorizedException(
        'Admins can only create invitations for Staff role',
      );
    }

    const shouldSendEmail = sendEmail === 'true';
    const invitation = await this.invitationService.createInvitation(
      createInvitationDto,
      req.user.id,
      shouldSendEmail,
    );

    return {
      message: shouldSendEmail
        ? 'Invitation created and email sent successfully'
        : 'Invitation created successfully',
      invitation,
    };
  }

  /**
   * Get all invitations
   * Accessible by Super Admins and Admins
   */
  @Get('invitations')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async getAllInvitations(
    @Request() req,
    @Query('status') status?: InvitationStatus,
  ) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN && userRole !== RoleType.ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins and Admins can view invitations',
      );
    }

    const invitations = await this.invitationService.findAll(status);
    return { invitations };
  }

  /**
   * Get invitation by ID
   * Accessible by Super Admins and Admins
   */
  @Get('invitations/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, User))
  async getInvitation(@Param('id') id: string, @Request() req) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN && userRole !== RoleType.ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins and Admins can view invitations',
      );
    }

    const invitation = await this.invitationService.findOne(+id);
    return { invitation };
  }

  /**
   * Revoke an invitation
   * Accessible by Super Admins and Admins
   */
  @Delete('invitations/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, User))
  async revokeInvitation(@Param('id') id: string, @Request() req) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN && userRole !== RoleType.ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins and Admins can revoke invitations',
      );
    }

    await this.invitationService.revokeInvitation(+id);
    return { message: 'Invitation revoked successfully' };
  }

  /**
   * Resend an invitation
   * Accessible by Super Admins and Admins
   */
  @Post('invitations/:id/resend')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, User))
  async resendInvitation(
    @Param('id') id: string,
    @Request() req,
    @Query('sendEmail') sendEmail?: string,
  ) {
    const userRole = req.user?.role?.name || req.user?.roleName;

    if (userRole !== RoleType.SUPER_ADMIN && userRole !== RoleType.ADMIN) {
      throw new UnauthorizedException(
        'Only Super Admins and Admins can resend invitations',
      );
    }

    const shouldSendEmail = sendEmail === 'true';
    const invitation = await this.invitationService.resendInvitation(
      +id,
      req.user.id,
      shouldSendEmail,
    );
    return {
      message: shouldSendEmail
        ? 'Invitation resent and email sent successfully'
        : 'Invitation resent successfully',
      invitation,
    };
  }
}

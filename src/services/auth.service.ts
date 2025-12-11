import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../services/user.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import { AuditLogService } from './audit-log.service';
import { PasswordHistoryService } from './password-history.service';
import { TokenBlacklistService } from 'src/services/token-blacklist.service';
import { OtpType } from 'src/entity/otp.entity';
import { AuditLogAction } from 'src/entity/audit-log.entity';
import { VerifyOtpDto } from 'src/dtos/register-otp.dto';
import { RegisterInitDto } from 'src/dtos/register-otp.dto';
import { ForgotPasswordDto } from 'src/dtos/forgot-password.dto';
import { VerifyResetOtpDto } from 'src/dtos/forgot-password.dto';
import {
  InvalidCredentialsException,
  DuplicateResourceException,
  ExpiredException,
  ResourceNotFoundException,
} from 'src/exceptions/custom-exceptions';
import { AcceptInvitationDto } from '../dtos/invitation.dto';
import { InvitationService } from './invitation.service';
import { RoleService } from './role.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly MAX_PASSWORD_RESET_REQUESTS_PER_DAY = 3;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private emailService: EmailService,
    private invitationService: InvitationService,
    private roleService: RoleService,
    private auditLogService: AuditLogService,
    private passwordHistoryService: PasswordHistoryService,
    private tokenBlacklistService: TokenBlacklistService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (!user) return null;

    const isValid = await user.validatePassword(password);
    if (isValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new InvalidCredentialsException('Invalid username or password');
    }

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role?.name, // Include role in JWT
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role?.name, // Include role in response
        roleDisplayName: user.role?.displayName,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if username already exists
    const existingUserByUsername = await this.userService.findByUsername(
      registerDto.username,
    );
    if (existingUserByUsername) {
      throw new DuplicateResourceException('User', 'username');
    }

    // Check if email already exists
    const existingUserByEmail = await this.userService.findByEmail(
      registerDto.email,
    );
    if (existingUserByEmail) {
      throw new DuplicateResourceException('User', 'email');
    }

    // Get default role
    const user = await this.userService.create(registerDto);

    const { password, ...result } = user;
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async registerInit(registerDto: RegisterDto) {
    // Check if username already exists
    const existingUserByUsername = await this.userService.findByUsername(
      registerDto.username,
    );
    if (existingUserByUsername) {
      throw new DuplicateResourceException('User', 'username');
    }

    // Check if email already exists
    const existingUserByEmail = await this.userService.findByEmail(
      registerDto.email,
    );
    if (existingUserByEmail) {
      throw new DuplicateResourceException('User', 'email');
    }

    // Store registration data temporarily (you can use Redis or database)
    // For now, we'll send OTP and expect the user to complete registration
    const otp = await this.otpService.createOTP(
      registerDto.email,
      OtpType.REGISTRATION,
    );
    await this.emailService.sendOTP(registerDto.email, otp, 'registration');

    return {
      message: 'OTP sent to email. Please verify to complete registration.',
      email: registerDto.email,
    };
  }

  async verifyAndCompleteRegistration(
    verifyDto: VerifyOtpDto,
    userData: RegisterInitDto,
  ) {
    const verificationResult = await this.otpService.verifyOTP(
      verifyDto.email,
      verifyDto.otp,
      OtpType.REGISTRATION,
    );

    if (!verificationResult.success) {
      throw new BadRequestException(
        verificationResult.message || 'Invalid OTP',
      );
    }

    // Create the user
    const user = await this.userService.create({
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
      phone: userData.phone,
      isEmailVerified: true,
    });

    const { password, ...result } = user;
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
  ) {
    const email = forgotPasswordDto.email;
    const user = await this.userService.findByEmail(email);

    // Check rate limiting - max requests per day
    const requestsInLast24h =
      await this.auditLogService.getPasswordResetAttemptsInLast24Hours(email);

    if (requestsInLast24h >= this.MAX_PASSWORD_RESET_REQUESTS_PER_DAY) {
      // Log the attempt
      await this.auditLogService.create({
        userId: user?.id,
        action: AuditLogAction.PASSWORD_RESET_REQUESTED,
        email,
        ipAddress,
        isSuccessful: false,
        metadata: { reason: 'Rate limit exceeded' },
      });

      throw new BadRequestException(
        'Too many password reset requests. Please try again later.',
      );
    }

    if (!user) {
      // Log the attempt for non-existent user
      await this.auditLogService.create({
        action: AuditLogAction.PASSWORD_RESET_REQUESTED,
        email,
        ipAddress,
        isSuccessful: false,
        metadata: { reason: 'User not found' },
      });

      // Don't reveal if email exists (security best practice)
      return { message: 'If the email exists, a reset code will be sent.' };
    }

    // Invalidate any previous OTPs
    await this.otpService.invalidateUserOTPs(email, OtpType.PASSWORD_RESET);

    // Create and send new OTP
    const otp = await this.otpService.createOTP(
      user.email,
      OtpType.PASSWORD_RESET,
      user.id,
    );
    await this.emailService.sendOTP(user.email, otp, 'password_reset');

    // Log successful request
    await this.auditLogService.create({
      userId: user.id,
      action: AuditLogAction.PASSWORD_RESET_REQUESTED,
      email,
      ipAddress,
      isSuccessful: true,
    });

    return { message: 'Password reset code sent to email.' };
  }

  async resetPassword(resetDto: VerifyResetOtpDto, ipAddress?: string) {
    const email = resetDto.email;
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new ResourceNotFoundException('User');
    }

    // Verify OTP
    const verificationResult = await this.otpService.verifyOTP(
      email,
      resetDto.otp,
      OtpType.PASSWORD_RESET,
    );

    if (!verificationResult.success) {
      // Log failed attempt
      await this.auditLogService.create({
        userId: user.id,
        action: AuditLogAction.PASSWORD_RESET_FAILED,
        email,
        ipAddress,
        isSuccessful: false,
        metadata: {
          reason: verificationResult.message,
          attemptsLeft: verificationResult.attemptsLeft,
        },
      });

      throw new BadRequestException(
        verificationResult.message || 'Invalid or expired OTP',
      );
    }

    // Check if password was used before
    const isPasswordReused = await this.passwordHistoryService.isPasswordReused(
      user.id,
      resetDto.newPassword,
    );

    if (isPasswordReused) {
      await this.auditLogService.create({
        userId: user.id,
        action: AuditLogAction.PASSWORD_RESET_FAILED,
        email,
        ipAddress,
        isSuccessful: false,
        metadata: { reason: 'Password reused' },
      });

      throw new BadRequestException(
        'You cannot reuse one of your last 5 passwords. Please choose a different password.',
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(resetDto.newPassword, salt);

    // Add current password to history before updating
    if (user.password) {
      await this.passwordHistoryService.addToHistory(user.id, user.password);
    }

    // Update password
    await this.userService.update(user.id, { password: hashedPassword });

    // Blacklist all existing tokens for this user
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN') || '24h';
    const expiresInSeconds = this.parseJwtExpiry(jwtExpiresIn);
    await this.tokenBlacklistService.blacklistUserTokens(
      user.id,
      expiresInSeconds,
    );

    // Send notification email
    await this.emailService.sendPasswordChangeNotification(
      user.email,
      `${user.firstName} ${user.lastName}`,
      ipAddress,
    );

    // Log successful password reset
    await this.auditLogService.create({
      userId: user.id,
      action: AuditLogAction.PASSWORD_RESET_SUCCESS,
      email,
      ipAddress,
      isSuccessful: true,
    });

    return {
      message:
        'Password reset successful. Please login with your new password.',
    };
  }

  private parseJwtExpiry(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 86400; // Default 24 hours
    }
  }

  async validateGoogleUser(googleUser: any) {
    let user = await this.userService.findByGoogleId(googleUser.googleId);

    if (!user) {
      // Check if email exists
      user = await this.userService.findByEmail(googleUser.email);

      if (user) {
        // Link Google account to existing user
        user.googleId = googleUser.googleId;
        user.isEmailVerified = true;
        await this.userService.update(user.id, user);
      } else {
        // Create new user - generate username from email
        const username =
          googleUser.email.split('@')[0] +
          Math.floor(Math.random() * 1000).toString();
        user = await this.userService.create({
          username,
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          googleId: googleUser.googleId,
          isEmailVerified: true,
          password: Math.random().toString(36), // Random password for Google users
        });
      }
    }

    return user;
  }

  async googleLogin(user: any) {
    const payload = {
      username: user.username,
      email: user.email,
      sub: user.id,
      role: user.role?.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role?.name,
        roleDisplayName: user.role?.displayName,
      },
    };
  }

  async registerWithInvitation(
    token: string,
    acceptInvitationDto: AcceptInvitationDto,
  ) {
    // Validate invitation
    const invitation = await this.invitationService.validateInvitation(token);

    // Check if username already exists
    const existingUserByUsername = await this.userService.findByUsername(
      acceptInvitationDto.username,
    );
    if (existingUserByUsername) {
      throw new DuplicateResourceException('User', 'username');
    }

    // Check if email already exists
    const existingUserByEmail = await this.userService.findByEmail(
      invitation.email,
    );
    if (existingUserByEmail) {
      throw new DuplicateResourceException('User', 'email');
    }

    // Get the role based on invitation
    const role = await this.roleService.findByName(invitation.roleType);
    if (!role) {
      throw new Error('Role not found in database');
    }

    // Create user with the role from invitation
    const user = await this.userService.create({
      username: acceptInvitationDto.username,
      email: invitation.email,
      firstName: acceptInvitationDto.firstName,
      lastName: acceptInvitationDto.lastName,
      password: acceptInvitationDto.password,
      phone: acceptInvitationDto.phone || '',
      roleId: role.id,
      isEmailVerified: true, // Invited users are auto-verified
    });

    // Mark invitation as accepted
    await this.invitationService.markAsAccepted(token, user.id);

    // Generate JWT token
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role?.name,
    };

    const { password, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName,
        lastName: userWithoutPassword.lastName,
        phone: userWithoutPassword.phone,
        role: user.role?.name,
        roleDisplayName: user.role?.displayName,
      },
      message: 'Account created successfully using invitation',
    };
  }
}

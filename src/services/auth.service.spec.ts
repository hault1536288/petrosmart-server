import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import { AuditLogService } from './audit-log.service';
import { PasswordHistoryService } from './password-history.service';
import { TokenBlacklistService } from 'src/services/token-blacklist.service';
import { InvitationService } from './invitation.service';
import { RoleService } from './role.service';
import { OtpType } from '../entity/otp.entity';
import { AuditLogAction } from '../entity/audit-log.entity';

describe('AuthService - Password Reset', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let otpService: jest.Mocked<OtpService>;
  let emailService: jest.Mocked<EmailService>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let passwordHistoryService: jest.Mocked<PasswordHistoryService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    password: '$2b$10$hashedpassword',
    phone: '1234567890',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    googleId: null,
    role: { id: 1, name: 'user' },
    roleId: 1,
    validatePassword: jest.fn(),
    hashPassword: jest.fn(),
    managedStations: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            update: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: OtpService,
          useValue: {
            createOTP: jest.fn(),
            verifyOTP: jest.fn(),
            invalidateUserOTPs: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendOTP: jest.fn(),
            sendPasswordChangeNotification: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            create: jest.fn(),
            getPasswordResetAttemptsInLast24Hours: jest.fn(),
          },
        },
        {
          provide: PasswordHistoryService,
          useValue: {
            isPasswordReused: jest.fn(),
            addToHistory: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            blacklistUserTokens: jest.fn(),
          },
        },
        {
          provide: InvitationService,
          useValue: {
            validateInvitation: jest.fn(),
            markAsAccepted: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            findByName: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_EXPIRES_IN') return '24h';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    otpService = module.get(OtpService);
    emailService = module.get(EmailService);
    auditLogService = module.get(AuditLogService);
    passwordHistoryService = module.get(PasswordHistoryService);
    tokenBlacklistService = module.get(TokenBlacklistService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should send OTP when email exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      auditLogService.getPasswordResetAttemptsInLast24Hours.mockResolvedValue(
        0,
      );
      otpService.createOTP.mockResolvedValue('123456');
      otpService.invalidateUserOTPs.mockResolvedValue(undefined);
      emailService.sendOTP.mockResolvedValue(undefined);
      auditLogService.create.mockResolvedValue(undefined as any);

      const result = await service.forgotPassword(
        { email: 'test@example.com' },
        '127.0.0.1',
      );

      expect(result.message).toBe('Password reset code sent to email.');
      expect(otpService.invalidateUserOTPs).toHaveBeenCalledWith(
        'test@example.com',
        OtpType.PASSWORD_RESET,
      );
      expect(otpService.createOTP).toHaveBeenCalledWith(
        'test@example.com',
        OtpType.PASSWORD_RESET,
        1,
      );
      expect(emailService.sendOTP).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'password_reset',
      );
      expect(auditLogService.create).toHaveBeenCalledWith({
        userId: 1,
        action: AuditLogAction.PASSWORD_RESET_REQUESTED,
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        isSuccessful: true,
      });
    });

    it('should not reveal if email does not exist', async () => {
      userService.findByEmail.mockResolvedValue(null);
      auditLogService.getPasswordResetAttemptsInLast24Hours.mockResolvedValue(
        0,
      );
      auditLogService.create.mockResolvedValue(undefined as any);

      const result = await service.forgotPassword(
        { email: 'nonexistent@example.com' },
        '127.0.0.1',
      );

      expect(result.message).toBe(
        'If the email exists, a reset code will be sent.',
      );
      expect(otpService.createOTP).not.toHaveBeenCalled();
      expect(emailService.sendOTP).not.toHaveBeenCalled();
    });

    it('should throw error when rate limit exceeded', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      auditLogService.getPasswordResetAttemptsInLast24Hours.mockResolvedValue(
        5,
      );
      auditLogService.create.mockResolvedValue(undefined as any);

      await expect(
        service.forgotPassword({ email: 'test@example.com' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);

      expect(auditLogService.create).toHaveBeenCalledWith({
        userId: 1,
        action: AuditLogAction.PASSWORD_RESET_REQUESTED,
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        isSuccessful: false,
        metadata: { reason: 'Rate limit exceeded' },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      otpService.verifyOTP.mockResolvedValue({
        success: true,
      });
      passwordHistoryService.isPasswordReused.mockResolvedValue(false);
      passwordHistoryService.addToHistory.mockResolvedValue(undefined);
      userService.update.mockResolvedValue(undefined as any);
      tokenBlacklistService.blacklistUserTokens.mockResolvedValue(undefined);
      emailService.sendPasswordChangeNotification.mockResolvedValue(undefined);
      auditLogService.create.mockResolvedValue(undefined as any);

      const result = await service.resetPassword(
        {
          email: 'test@example.com',
          otp: '123456',
          newPassword: 'NewSecurePass123!',
        },
        '127.0.0.1',
      );

      expect(result.message).toBe(
        'Password reset successful. Please login with your new password.',
      );
      expect(passwordHistoryService.isPasswordReused).toHaveBeenCalled();
      expect(passwordHistoryService.addToHistory).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalled();
      expect(tokenBlacklistService.blacklistUserTokens).toHaveBeenCalled();
      expect(emailService.sendPasswordChangeNotification).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        '127.0.0.1',
      );
      expect(auditLogService.create).toHaveBeenCalledWith({
        userId: 1,
        action: AuditLogAction.PASSWORD_RESET_SUCCESS,
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        isSuccessful: true,
      });
    });

    it('should reject invalid OTP', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      otpService.verifyOTP.mockResolvedValue({
        success: false,
        message: 'Invalid OTP',
        attemptsLeft: 2,
      });
      auditLogService.create.mockResolvedValue(undefined as any);

      await expect(
        service.resetPassword(
          {
            email: 'test@example.com',
            otp: 'wrong',
            newPassword: 'NewSecurePass123!',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(auditLogService.create).toHaveBeenCalledWith({
        userId: 1,
        action: AuditLogAction.PASSWORD_RESET_FAILED,
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        isSuccessful: false,
        metadata: {
          reason: 'Invalid OTP',
          attemptsLeft: 2,
        },
      });
    });

    it('should reject reused passwords', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      otpService.verifyOTP.mockResolvedValue({
        success: true,
      });
      passwordHistoryService.isPasswordReused.mockResolvedValue(true);
      auditLogService.create.mockResolvedValue(undefined as any);

      await expect(
        service.resetPassword(
          {
            email: 'test@example.com',
            otp: '123456',
            newPassword: 'OldPassword123!',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(auditLogService.create).toHaveBeenCalledWith({
        userId: 1,
        action: AuditLogAction.PASSWORD_RESET_FAILED,
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        isSuccessful: false,
        metadata: { reason: 'Password reused' },
      });
    });
  });
});

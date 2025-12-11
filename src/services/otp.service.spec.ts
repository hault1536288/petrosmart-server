import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { Otp, OtpType } from '../entity/otp.entity';

describe('OtpService', () => {
  let service: OtpService;
  let repository: jest.Mocked<Repository<Otp>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getRepositoryToken(Otp),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OTP_EXPIRY_MINUTES') return '10';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    repository = module.get(getRepositoryToken(Otp));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOTP', () => {
    it('should generate 6-digit OTP', () => {
      const otp = service.generateOTP();
      expect(otp).toHaveLength(6);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
    });
  });

  describe('createOTP', () => {
    it('should create and save OTP', async () => {
      const mockOtp = {
        id: 1,
        code: '123456',
        type: OtpType.PASSWORD_RESET,
        email: 'test@example.com',
        userId: 1,
        expiresAt: new Date(),
        isUsed: false,
        attempts: 0,
        isLocked: false,
        createdAt: new Date(),
      };

      repository.create.mockReturnValue(mockOtp as any);
      repository.save.mockResolvedValue(mockOtp as any);

      const code = await service.createOTP(
        'test@example.com',
        OtpType.PASSWORD_RESET,
        1,
      );

      expect(code).toHaveLength(6);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('verifyOTP', () => {
    it('should verify valid OTP', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);

      const mockOtp = {
        id: 1,
        code: '123456',
        type: OtpType.PASSWORD_RESET,
        email: 'test@example.com',
        userId: 1,
        expiresAt: futureDate,
        isUsed: false,
        attempts: 0,
        isLocked: false,
        createdAt: new Date(),
      };

      repository.findOne.mockResolvedValue(mockOtp as any);
      repository.save.mockResolvedValue({ ...mockOtp, isUsed: true } as any);

      const result = await service.verifyOTP(
        'test@example.com',
        '123456',
        OtpType.PASSWORD_RESET,
      );

      expect(result.success).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isUsed: true }),
      );
    });

    it('should reject expired OTP', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 5);

      const mockOtp = {
        id: 1,
        code: '123456',
        type: OtpType.PASSWORD_RESET,
        email: 'test@example.com',
        userId: 1,
        expiresAt: pastDate,
        isUsed: false,
        attempts: 0,
        isLocked: false,
        createdAt: new Date(),
      };

      repository.findOne.mockResolvedValue(mockOtp as any);

      const result = await service.verifyOTP(
        'test@example.com',
        '123456',
        OtpType.PASSWORD_RESET,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('OTP has expired');
    });

    it('should track failed attempts', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);

      const mockOtp = {
        id: 1,
        code: '123456',
        type: OtpType.PASSWORD_RESET,
        email: 'test@example.com',
        userId: 1,
        expiresAt: futureDate,
        isUsed: false,
        attempts: 2,
        isLocked: false,
        createdAt: new Date(),
      };

      repository.findOne.mockResolvedValue(mockOtp as any);
      repository.save.mockResolvedValue({
        ...mockOtp,
        attempts: 3,
      } as any);

      const result = await service.verifyOTP(
        'test@example.com',
        'wrong',
        OtpType.PASSWORD_RESET,
      );

      expect(result.success).toBe(false);
      expect(result.attemptsLeft).toBe(2);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ attempts: 3 }),
      );
    });

    it('should lock OTP after max attempts', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);

      const mockOtp = {
        id: 1,
        code: '123456',
        type: OtpType.PASSWORD_RESET,
        email: 'test@example.com',
        userId: 1,
        expiresAt: futureDate,
        isUsed: false,
        attempts: 4,
        isLocked: false,
        createdAt: new Date(),
      };

      repository.findOne.mockResolvedValue(mockOtp as any);
      repository.save.mockResolvedValue({
        ...mockOtp,
        attempts: 5,
        isLocked: true,
      } as any);

      const result = await service.verifyOTP(
        'test@example.com',
        'wrong',
        OtpType.PASSWORD_RESET,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'OTP is locked due to too many failed attempts',
      );
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ attempts: 5, isLocked: true }),
      );
    });

    it('should reject locked OTP', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5);

      const mockOtp = {
        id: 1,
        code: '123456',
        type: OtpType.PASSWORD_RESET,
        email: 'test@example.com',
        userId: 1,
        expiresAt: futureDate,
        isUsed: false,
        attempts: 5,
        isLocked: true,
        createdAt: new Date(),
      };

      repository.findOne.mockResolvedValue(mockOtp as any);

      const result = await service.verifyOTP(
        'test@example.com',
        '123456',
        OtpType.PASSWORD_RESET,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'OTP is locked due to too many failed attempts',
      );
    });
  });

  describe('invalidateUserOTPs', () => {
    it('should invalidate all user OTPs', async () => {
      repository.update.mockResolvedValue(undefined as any);

      await service.invalidateUserOTPs(
        'test@example.com',
        OtpType.PASSWORD_RESET,
      );

      expect(repository.update).toHaveBeenCalledWith(
        { email: 'test@example.com', type: OtpType.PASSWORD_RESET, isUsed: false },
        { isUsed: true },
      );
    });
  });
});


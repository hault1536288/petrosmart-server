import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Otp, OtpType } from '../entity/otp.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private configService: ConfigService,
  ) {}

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOTP(
    email: string,
    type: OtpType,
    userId?: number,
  ): Promise<string> {
    const code = this.generateOTP();
    const expiryMinutes = parseInt(
      this.configService.get('OTP_EXPIRY_MINUTES') || '10',
    );
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const otp = this.otpRepository.create({
      code,
      type,
      email,
      userId,
      expiresAt,
    });

    await this.otpRepository.save(otp);
    return code;
  }

  async verifyOTP(
    email: string,
    code: string,
    type: OtpType,
  ): Promise<{ success: boolean; message?: string; attemptsLeft?: number }> {
    // Find the most recent OTP for this email and type
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        type,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    if (new Date() > otp.expiresAt) {
      return { success: false, message: 'OTP has expired' };
    }

    if (otp.isLocked) {
      return {
        success: false,
        message: 'OTP is locked due to too many failed attempts',
      };
    }

    // Check if code matches
    if (otp.code !== code) {
      otp.attempts += 1;

      // Lock if max attempts reached
      if (otp.attempts >= this.MAX_ATTEMPTS) {
        otp.isLocked = true;
        await this.otpRepository.save(otp);
        return {
          success: false,
          message: 'OTP is locked due to too many failed attempts',
          attemptsLeft: 0,
        };
      }

      await this.otpRepository.save(otp);
      const attemptsLeft = this.MAX_ATTEMPTS - otp.attempts;
      return {
        success: false,
        message: `Invalid OTP. ${attemptsLeft} attempts remaining`,
        attemptsLeft,
      };
    }

    // Mark as used
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    return { success: true };
  }

  async cleanExpiredOTPs(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async invalidateUserOTPs(email: string, type: OtpType): Promise<void> {
    await this.otpRepository.update(
      { email, type, isUsed: false },
      { isUsed: true },
    );
  }

  async getOTPAttempts(email: string, type: OtpType): Promise<number> {
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        type,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    return otp?.attempts || 0;
  }
}

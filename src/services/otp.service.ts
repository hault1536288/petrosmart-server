import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Otp, OtpType } from '../entity/otp.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
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
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        code,
        type,
        isUsed: false,
      },
    });

    if (!otp) return false;
    if (new Date() > otp.expiresAt) return false;

    // Mark as used
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    return true;
  }

  async cleanExpiredOTPs(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}

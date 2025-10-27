import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { OtpType } from '../entity/otp.entity';

interface OtpData {
  code: string;
  type: OtpType;
  email: string;
  userId?: number;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class OtpRedisService {
  private readonly OTP_PREFIX = 'otp:';
  private readonly OTP_EXPIRY_SECONDS: number;

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.OTP_EXPIRY_SECONDS =
      parseInt(this.configService.get('OTP_EXPIRY_MINUTES') || '10') * 60;
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create Redis key for OTP
   */
  private getOtpKey(email: string, type: OtpType): string {
    return `${this.OTP_PREFIX}${type}:${email}`;
  }

  /**
   * Create and store OTP in Redis
   */
  async createOTP(
    email: string,
    type: OtpType,
    userId?: number,
  ): Promise<string> {
    const code = this.generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_SECONDS * 1000);

    const otpData: OtpData = {
      code,
      type,
      email,
      userId,
      createdAt: now,
      expiresAt,
    };

    const key = this.getOtpKey(email, type);

    // Store OTP with automatic expiration
    await this.redisService.set(key, otpData, this.OTP_EXPIRY_SECONDS);

    return code;
  }

  /**
   * Verify OTP from Redis
   */
  async verifyOTP(
    email: string,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    const key = this.getOtpKey(email, type);
    const otpData = await this.redisService.get<OtpData>(key);

    if (!otpData) return false; // OTP not found or expired
    if (otpData.code !== code) return false; // Invalid code

    // Delete OTP after successful verification (one-time use)
    await this.redisService.del(key);

    return true;
  }

  /**
   * Get remaining TTL for an OTP
   */
  async getOtpTTL(email: string, type: OtpType): Promise<number> {
    const key = this.getOtpKey(email, type);
    return this.redisService.ttl(key);
  }

  /**
   * Delete OTP manually
   */
  async deleteOTP(email: string, type: OtpType): Promise<number> {
    const key = this.getOtpKey(email, type);
    return this.redisService.del(key);
  }

  /**
   * Check if OTP exists
   */
  async otpExists(email: string, type: OtpType): Promise<boolean> {
    const key = this.getOtpKey(email, type);
    return this.redisService.exists(key);
  }
}

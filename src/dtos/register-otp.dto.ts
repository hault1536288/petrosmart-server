import { IsEmail, IsString, MinLength } from 'class-validator';
import { RegisterDto } from './register.dto';

/**
 * DTO for initiating OTP-based registration
 * Extends RegisterDto to avoid duplication
 */
export class RegisterInitDto extends RegisterDto {}

/**
 * DTO for verifying OTP during registration
 */
export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  otp: string;
}

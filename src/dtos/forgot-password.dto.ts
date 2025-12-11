import { IsEmail, IsString } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class VerifyResetOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsStrongPassword()
  newPassword: string;
}

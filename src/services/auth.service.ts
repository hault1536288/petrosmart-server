import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../services/user.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import { OtpType } from 'src/entity/otp.entity';
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

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private emailService: EmailService,
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
    const isValid = await this.otpService.verifyOTP(
      verifyDto.email,
      verifyDto.otp,
      OtpType.REGISTRATION,
    );

    if (!isValid) {
      throw new ExpiredException('OTP');
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset code will be sent.' };
    }

    const otp = await this.otpService.createOTP(
      user.email,
      OtpType.PASSWORD_RESET,
      user.id,
    );
    await this.emailService.sendOTP(user.email, otp, 'password_reset');

    return { message: 'Password reset code sent to email.' };
  }

  async resetPassword(resetDto: VerifyResetOtpDto) {
    const isValid = await this.otpService.verifyOTP(
      resetDto.email,
      resetDto.otp,
      OtpType.PASSWORD_RESET,
    );

    if (!isValid) {
      throw new ExpiredException('OTP');
    }

    const user = await this.userService.findByEmail(resetDto.email);
    if (!user) {
      throw new ResourceNotFoundException('User');
    }

    // Update password
    user.password = resetDto.newPassword;
    await this.userService.update(user.id, { password: resetDto.newPassword });

    return { message: 'Password reset successful' };
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
}

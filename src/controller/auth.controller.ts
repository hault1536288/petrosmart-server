import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterInitDto, VerifyOtpDto } from 'src/dtos/register-otp.dto';
import {
  ForgotPasswordDto,
  VerifyResetOtpDto,
} from 'src/dtos/forgot-password.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('register/init')
  async registerInit(@Body() registerDto: RegisterInitDto) {
    return this.authService.registerInit(registerDto);
  }

  @Post('register/verify')
  async verifyRegistration(
    @Body() body: { verifyDto: VerifyOtpDto; userData: RegisterInitDto },
  ) {
    return this.authService.verifyAndCompleteRegistration(
      body.verifyDto,
      body.userData,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: VerifyResetOtpDto) {
    return this.authService.resetPassword(resetDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req.user);
    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`,
    );
  }
}

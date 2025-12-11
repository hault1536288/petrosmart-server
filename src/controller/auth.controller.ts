import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Res,
  Req,
  Param,
  Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RegisterInitDto, VerifyOtpDto } from 'src/dtos/register-otp.dto';
import {
  ForgotPasswordDto,
  VerifyResetOtpDto,
} from 'src/dtos/forgot-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { AcceptInvitationDto } from '../dtos/invitation.dto';
import { InvitationService } from '../services/invitation.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
  ) {}

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
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto, ipAddress);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async resetPassword(
    @Body() resetDto: VerifyResetOtpDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.resetPassword(resetDto, ipAddress);
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

  /**
   * Validate invitation token (public endpoint)
   */
  @Get('invitations/:token/validate')
  async validateInvitation(@Param('token') token: string) {
    const invitation = await this.invitationService.validateInvitation(token);
    return {
      valid: true,
      email: invitation.email,
      roleType: invitation.roleType,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Register with invitation token (public endpoint)
   */
  @Post('register/invitation/:token')
  async registerWithInvitation(
    @Param('token') token: string,
    @Body() acceptInvitationDto: AcceptInvitationDto,
  ) {
    return this.authService.registerWithInvitation(token, acceptInvitationDto);
  }
}

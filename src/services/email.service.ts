import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendOTP(email: string, otp: string, type: string) {
    const subject =
      type === 'registration'
        ? 'Verify Your Email - Petrosmart'
        : 'Reset Your Password - Petrosmart';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .otp-box { background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${type === 'registration' ? 'Welcome to Petrosmart!' : 'Password Reset Request'}</h2>
          <p>Your verification code is:</p>
          <div class="otp-box">${otp}</div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>© 2025 Petrosmart. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject,
      html,
    });
  }

  async sendPasswordChangeNotification(
    email: string,
    userName: string,
    ipAddress?: string,
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Changed Successfully</h2>
          <div class="alert-box">
            <p><strong>✅ Your password has been changed</strong></p>
            <p>Hello ${userName},</p>
            <p>This is a confirmation that your Petrosmart account password was recently changed.</p>
            ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="warning-box">
            <p><strong>⚠️ Didn't change your password?</strong></p>
            <p>If you did not make this change, please contact our support team immediately at support@petrosmart.com</p>
          </div>
          <div class="footer">
            <p>© 2025 Petrosmart. All rights reserved.</p>
            <p>This is an automated security notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Password Changed - Petrosmart',
      html,
    });
  }

  async sendInvitation(
    email: string,
    invitationLink: string,
    roleType: string,
    inviterName: string,
    expiresAt: Date,
  ) {
    const expiryDays = Math.ceil(
      (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          .content { background: white; padding: 30px; border-radius: 8px; }
          .button { display: inline-block; padding: 14px 28px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #218838; }
          .info-box { background: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          .role-badge { display: inline-block; padding: 4px 12px; background: #007bff; color: white; border-radius: 12px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 style="color: #333; margin-top: 0;">Welcome to Petrosmart! 🎉</h1>
            
            <p style="font-size: 16px;">Hello,</p>
            
            <p style="font-size: 16px;">
              <strong>${inviterName}</strong> has invited you to join Petrosmart as a 
              <span class="role-badge">${roleType.toUpperCase()}</span>
            </p>

            <div class="info-box">
              <p style="margin: 0;"><strong>📧 Your Email:</strong> ${email}</p>
              <p style="margin: 10px 0 0 0;"><strong>⏰ Expires in:</strong> ${expiryDays} days</p>
            </div>

            <p style="font-size: 16px;">
              Click the button below to create your account and get started:
            </p>

            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">Create My Account</a>
            </div>

            <p style="font-size: 14px; color: #666;">
              Or copy and paste this link in your browser:<br>
              <a href="${invitationLink}" style="color: #007bff; word-break: break-all;">${invitationLink}</a>
            </p>

            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Important:</strong> This invitation link will expire on 
                <strong>${expiresAt.toLocaleDateString()}</strong>. 
                Please complete your registration before then.
              </p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you didn't expect this invitation or believe it was sent in error, 
              you can safely ignore this email.
            </p>
          </div>

          <div class="footer">
            <p>© 2025 Petrosmart. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: `You're Invited to Join Petrosmart as ${roleType}`,
      html,
    });
  }
}

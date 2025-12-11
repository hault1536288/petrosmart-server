import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controller/auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { UserModule } from '../module/user.module';
import { EmailService } from '../services/email.service';
import { OtpService } from '../services/otp.service';
import { RoleService } from '../services/role.service';
import { AuditLogService } from '../services/audit-log.service';
import { PasswordHistoryService } from '../services/password-history.service';
import { TokenBlacklistService } from 'src/services/token-blacklist.service';
import { InvitationService } from '../services/invitation.service';
import { Otp } from '../entity/otp.entity';
import { Role } from 'src/entity/roles.entity';
import { AuditLog } from '../entity/audit-log.entity';
import { PasswordHistory } from '../entity/password-history.entity';
import { Invitation } from '../entity/invitation.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    RedisModule,
    TypeOrmModule.forFeature([
      Otp,
      Role,
      AuditLog,
      PasswordHistory,
      Invitation,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    EmailService,
    OtpService,
    RoleService,
    AuditLogService,
    PasswordHistoryService,
    TokenBlacklistService,
    InvitationService,
  ],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}

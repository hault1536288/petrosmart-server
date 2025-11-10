import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Role } from '../entity/roles.entity';
import { Invitation } from '../entity/invitation.entity';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { InvitationService } from '../services/invitation.service';
import { EmailService } from '../services/email.service';
import { UserController } from '../controller/user.controller';
import { CaslModule } from '../casl/casl.module';
import { SubscriptionModule } from './subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Invitation]),
    CaslModule,
    SubscriptionModule,
  ],
  controllers: [UserController],
  providers: [UserService, RoleService, InvitationService, EmailService],
  exports: [UserService, InvitationService],
})
export class UserModule {}

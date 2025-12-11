import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditLogAction {
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_FAILED = 'password_reset_failed',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  OTP_VERIFICATION_FAILED = 'otp_verification_failed',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  ACCOUNT_LOCKED = 'account_locked',
}

@Entity('audit_logs')
@Index(['userId', 'action', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: AuditLogAction,
  })
  action: AuditLogAction;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isSuccessful: boolean;

  @CreateDateColumn()
  createdAt: Date;
}


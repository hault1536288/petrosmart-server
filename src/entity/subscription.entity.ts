import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.subscription, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  userId: number;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column({ nullable: true })
  startDate?: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({ nullable: true })
  trialEndDate?: Date;

  @Column({ nullable: true })
  nextBillingDate?: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  // Features/Limits based on plan
  @Column({ default: 5 })
  maxStations: number;

  @Column({ default: 10 })
  maxStaff: number;

  @Column({ default: 1000 })
  maxTransactionsPerMonth: number;

  @Column({ default: false })
  hasAdvancedReporting: boolean;

  @Column({ default: false })
  hasApiAccess: boolean;

  @Column({ default: false })
  hasPrioritySupport: boolean;

  // Payment information
  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  paymentMethod: string; // credit_card, bank_transfer, etc.

  @Column({ nullable: true })
  lastPaymentDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  lastPaymentAmount: number;

  @Column({ default: 0 })
  failedPaymentAttempts: number;

  // Auto-renewal
  @Column({ default: true })
  autoRenew: boolean;

  // Notes and metadata
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isActive(): boolean {
    return (
      this.status === SubscriptionStatus.ACTIVE ||
      this.status === SubscriptionStatus.TRIAL
    );
  }

  isExpired(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
  }

  isInTrial(): boolean {
    return (
      this.status === SubscriptionStatus.TRIAL &&
      !!this.trialEndDate &&
      new Date() < this.trialEndDate
    );
  }

  daysUntilExpiration(): number | null {
    if (!this.endDate) return null;
    const diff = this.endDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  IsDate,
  Min,
} from 'class-validator';
import { SubscriptionPlan, SubscriptionStatus } from '../entity/subscription.entity';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  trialDays?: number;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class UpdateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyPrice?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpgradeSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  newPlan: SubscriptionPlan;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class CancelSubscriptionDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  cancelImmediately?: boolean; // If false, cancel at end of billing period
}

export class SubscriptionResponseDto {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthlyPrice: number;
  startDate?: Date;
  endDate?: Date;
  trialEndDate?: Date;
  nextBillingDate?: Date;
  isActive: boolean;
  daysUntilExpiration: number | null;
  features: {
    maxStations: number;
    maxStaff: number;
    maxTransactionsPerMonth: number;
    hasAdvancedReporting: boolean;
    hasApiAccess: boolean;
    hasPrioritySupport: boolean;
  };
}

export class PaymentDto {
  @IsNumber()
  @IsNotEmpty()
  subscriptionId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}


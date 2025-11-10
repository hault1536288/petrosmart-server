import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { SubscriptionPlan } from '../entity/subscription.entity';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  // Subscription fields
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlan;

  @IsNumber()
  @IsOptional()
  @Min(0)
  trialDays?: number;
}

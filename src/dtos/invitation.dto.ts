import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
  MinLength,
} from 'class-validator';
import { RoleType } from '../entity/roles.entity';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(RoleType)
  @IsNotEmpty()
  roleType: RoleType;

  @IsNumber()
  @IsOptional()
  stationId?: number;
}

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

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
}

export class InvitationResponseDto {
  id: number;
  token: string;
  email: string;
  roleType: RoleType;
  stationId?: number;
  expiresAt: Date;
  invitationLink: string;
}


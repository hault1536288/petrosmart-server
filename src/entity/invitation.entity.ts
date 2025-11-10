import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { RoleType } from './roles.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: RoleType,
  })
  roleType: RoleType;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ nullable: true })
  stationId: number;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'invitedBy' })
  inviter: User;

  @Column()
  invitedBy: number;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  acceptedBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


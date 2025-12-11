import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog, AuditLogAction } from '../entity/audit-log.entity';

interface CreateAuditLogDto {
  userId?: number;
  action: AuditLogAction;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  isSuccessful: boolean;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  async getRecentFailedAttempts(
    identifier: string,
    action: AuditLogAction,
    minutesAgo: number = 15,
  ): Promise<number> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutesAgo);

    const count = await this.auditLogRepository.count({
      where: [
        {
          email: identifier,
          action,
          isSuccessful: false,
          createdAt: LessThan(since) as any,
        },
        {
          ipAddress: identifier,
          action,
          isSuccessful: false,
          createdAt: LessThan(since) as any,
        },
      ],
    });

    return count;
  }

  async getPasswordResetAttemptsInLast24Hours(
    email: string,
  ): Promise<number> {
    const since = new Date();
    since.setHours(since.getHours() - 24);

    return this.auditLogRepository.count({
      where: {
        email,
        action: AuditLogAction.PASSWORD_RESET_REQUESTED,
        createdAt: LessThan(since) as any,
      },
    });
  }

  async cleanOldLogs(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.auditLogRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
  }

  async findByUserId(
    userId: number,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}


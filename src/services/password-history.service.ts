import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordHistory } from '../entity/password-history.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHistoryService {
  private readonly HISTORY_LIMIT = 5; // Keep last 5 passwords

  constructor(
    @InjectRepository(PasswordHistory)
    private passwordHistoryRepository: Repository<PasswordHistory>,
  ) {}

  async addToHistory(userId: number, passwordHash: string): Promise<void> {
    // Add new password to history
    const history = this.passwordHistoryRepository.create({
      userId,
      passwordHash,
    });
    await this.passwordHistoryRepository.save(history);

    // Keep only the last N passwords
    const allHistory = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (allHistory.length > this.HISTORY_LIMIT) {
      const toDelete = allHistory.slice(this.HISTORY_LIMIT);
      await this.passwordHistoryRepository.remove(toDelete);
    }
  }

  async isPasswordReused(
    userId: number,
    newPassword: string,
  ): Promise<boolean> {
    const history = await this.passwordHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: this.HISTORY_LIMIT,
    });

    for (const record of history) {
      const isMatch = await bcrypt.compare(newPassword, record.passwordHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  }

  async clearHistory(userId: number): Promise<void> {
    await this.passwordHistoryRepository.delete({ userId });
  }
}


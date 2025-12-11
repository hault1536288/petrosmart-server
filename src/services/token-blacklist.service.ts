import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Blacklist a JWT token
   * @param token - The JWT token to blacklist
   * @param expiresIn - Time in seconds until token naturally expires
   */
  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:${token}`;
    // Store with TTL matching token expiry
    await this.cacheManager.set(key, 'blacklisted', expiresIn * 1000);
  }

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.cacheManager.get(key);
    return result === 'blacklisted';
  }

  /**
   * Blacklist all tokens for a user (e.g., after password change)
   * @param userId - The user ID
   * @param expiresIn - Maximum token lifetime in seconds (e.g., 24h = 86400)
   */
  async blacklistUserTokens(userId: number, expiresIn: number): Promise<void> {
    const key = `blacklist:user:${userId}`;
    const timestamp = Date.now();
    await this.cacheManager.set(key, timestamp, expiresIn * 1000);
  }

  /**
   * Check if user's tokens are blacklisted
   * @param userId - The user ID
   * @param tokenIssuedAt - When the token was issued (in seconds)
   * @returns true if token was issued before blacklist, false otherwise
   */
  async areUserTokensBlacklisted(
    userId: number,
    tokenIssuedAt: number,
  ): Promise<boolean> {
    const key = `blacklist:user:${userId}`;
    const blacklistTimestamp = await this.cacheManager.get<number>(key);

    if (!blacklistTimestamp) {
      return false;
    }

    // Convert tokenIssuedAt from seconds to milliseconds
    const tokenIssuedAtMs = tokenIssuedAt * 1000;
    return tokenIssuedAtMs < blacklistTimestamp;
  }
}

import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('❌ Redis connection error:', error);
    });
  }

  /**
   * Get value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Set value in Redis with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await this.client.setex(key, ttl, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  /**
   * Delete key from Redis
   */
  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  /**
   * Get time-to-live for a key
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Increment value (useful for counters)
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Decrement value
   */
  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  /**
   * Hash operations - Set hash field
   */
  async hset(key: string, field: string, value: any): Promise<number> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    return this.client.hset(key, field, stringValue);
  }

  /**
   * Hash operations - Get hash field
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Hash operations - Get all hash fields
   */
  async hgetall<T>(key: string): Promise<T | null> {
    const value = await this.client.hgetall(key);
    if (!value || Object.keys(value).length === 0) return null;

    // Try to parse each value
    const parsed: any = {};
    for (const [field, val] of Object.entries(value)) {
      try {
        parsed[field] = JSON.parse(val);
      } catch {
        parsed[field] = val;
      }
    }

    return parsed as T;
  }

  /**
   * Hash operations - Delete hash field
   */
  async hdel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field);
  }

  /**
   * List operations - Push to list
   */
  async lpush(key: string, value: any): Promise<number> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    return this.client.lpush(key, stringValue);
  }

  /**
   * List operations - Pop from list
   */
  async lpop<T>(key: string): Promise<T | null> {
    const value = await this.client.lpop(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Get Redis client for advanced operations
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }
}

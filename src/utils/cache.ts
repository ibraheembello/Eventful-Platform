import redis from '../config/redis';

export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  static async set(key: string, data: unknown, ttlSeconds = 300): Promise<void> {
    if (!redis) return;
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  }

  static async del(key: string): Promise<void> {
    if (!redis) return;
    await redis.del(key);
  }

  static async delPattern(pattern: string): Promise<void> {
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  static async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    const result = await redis.exists(key);
    return result === 1;
  }
}

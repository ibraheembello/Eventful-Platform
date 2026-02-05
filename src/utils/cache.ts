import redis from '../config/redis';

export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  static async set(key: string, data: unknown, ttlSeconds = 300): Promise<void> {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  }

  static async del(key: string): Promise<void> {
    await redis.del(key);
  }

  static async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  static async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  }
}

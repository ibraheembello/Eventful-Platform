import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Make Redis optional - only connect if REDIS_URL is provided
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });
} else {
  console.log('Redis is not configured - running without cache');
}

export default redis;

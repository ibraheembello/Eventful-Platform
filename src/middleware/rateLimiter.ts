import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';

// Helper to properly type the sendCommand for rate-limit-redis
// redis.call() expects (command, ...args) but rate-limit-redis passes all as a flat array.
// We extract the first element as the command name and spread the rest.
const sendCommand = redis ? (...args: string[]) => {
  const [command, ...restArgs] = args;
  return redis!.call(command as any, ...restArgs) as any;
} : undefined;

// Base configuration for rate limiters
const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
};

export const globalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 500,
  ...(redis && sendCommand ? { store: new RedisStore({ sendCommand }) } : {}),
});

export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  ...(redis && sendCommand ? { store: new RedisStore({ sendCommand, prefix: 'rl:auth:' }) } : {}),
});

export const paymentLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.',
  },
  ...(redis && sendCommand ? { store: new RedisStore({ sendCommand, prefix: 'rl:payment:' }) } : {}),
});

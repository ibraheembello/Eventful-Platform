import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';

// Helper to properly type the sendCommand for rate-limit-redis
// redis.call() expects (command, ...args) but rate-limit-redis passes all as a flat array.
// We extract the first element as the command name and spread the rest.
const sendCommand = (...args: string[]) => {
  const [command, ...restArgs] = args;
  return redis.call(command as any, ...restArgs) as any;
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand }),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand, prefix: 'rl:auth:' }),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ sendCommand, prefix: 'rl:payment:' }),
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.',
  },
});

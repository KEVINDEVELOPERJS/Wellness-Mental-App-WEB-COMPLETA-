import rateLimit from 'express-rate-limit';
import redis from '../config/redis';

// Redis store implementation
const redisStore = {
  async increment(key: string): Promise<number> {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 60); // 60 second window
    }
    return current;
  },

  async reset(key: string): Promise<void> {
    await redis.del(key);
  },
};

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
  skipFailedRequests: true, // Don't count failed requests against the limit
  keyGenerator: (req) => {
    // Use IP address, handling proxy headers properly
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
  skipFailedRequests: true, // Don't count failed requests against the limit
  keyGenerator: (req) => {
    // Use IP address, handling proxy headers properly
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Rate limit exceeded, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
  skipFailedRequests: true, // Don't count failed requests against the limit
  keyGenerator: (req) => {
    // Use IP address, handling proxy headers properly
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

export const alertRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 alerts per minute
  message: 'Too many alert requests, please wait',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
  skipFailedRequests: true, // Don't count failed requests against the limit
  keyGenerator: (req) => {
    // Use IP address, handling proxy headers properly
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

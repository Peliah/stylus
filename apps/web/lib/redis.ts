import type { ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

/** Plain connection config for BullMQ — avoids ioredis version mismatch with bullmq's bundled types. */
export function getBullMqConnection(): ConnectionOptions {
  return {
    url: redisUrl,
    maxRetriesPerRequest: null,
  };
}

let redisClient: Redis | undefined;

/** Singleton ioredis client for direct Redis commands (health cache, etc.). */
export function getRedisConnection(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }
  return redisClient;
}

export const redis = getRedisConnection();
export default redis;

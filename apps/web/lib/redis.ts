import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const getRedisConnection = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Critical requirement for BullMQ
  });
};

export const redis = getRedisConnection();
export default redis;

import { createClient } from 'redis';
import RedisConfig from '../config/redis.config';
import logger from './logger';

export async function connectToRedis(): Promise<void> {
  try {
    const pubClient = createClient({ url: RedisConfig.url });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    logger.info('Redis server connected');
  } catch (error) {
    logger.error('Error connecting to Redis server:', error);
  }
}

export function getRedisConnection() {
  const url = new URL(RedisConfig.url || 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
  };
}

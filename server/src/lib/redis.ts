import * as redis from 'redis';
import redisConfig from '../config/redis.config';
import logger from './logger';

let redisClient: redis.RedisClientType;

void (async () => {
  try {
    redisClient = redis.createClient({ url: redisConfig.url });

    redisClient.on('error', (error: Error) => logger.error(`Error : ${error?.message}`));
    await redisClient.connect();
    logger.info('Redis server connected');
    
  } catch (err) {
    logger.error(`Error : ${err}`);
  }
})();

export default redisClient;

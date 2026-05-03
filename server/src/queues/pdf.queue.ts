import { Queue } from 'bullmq';
import * as RedisUtils from '../lib/redis.utils';
import logger from '../lib/logger';

export const pdfEmbeddingQueue = new Queue('pdf-embedding-queue', {
  connection: RedisUtils.getRedisConnection(),
});

export const enqueuePdfForEmbedding = async (fileUrl: string) => {
  try {
    await pdfEmbeddingQueue.add(
      'embed-pdf',
      { fileUrl },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
    logger.info(`Enqueued PDF for embedding: ${fileUrl}`);
  } catch (error) {
    logger.error('Failed to enqueue PDF for embedding:', error);
    throw error;
  }
};

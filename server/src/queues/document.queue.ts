import { Queue } from 'bullmq';
import * as RedisUtils from '../lib/redis.utils';
import logger from '../lib/logger';
import { DocumentType } from '../models/document.model';

export interface DocumentJobData {
  fileUrl: string;          // absolute path on disk
  documentId: string;       // Postgres document record ID — worker updates its status
  projectId: string;        // for scoping PGVector metadata
  fileType: DocumentType;   // resolved by the upload handler
  originalName: string;     // human-readable filename
}

export const documentQueue = new Queue<DocumentJobData>('document-embedding-queue', {
  connection: RedisUtils.getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100, // keep last 100 completed jobs for inspection
    removeOnFail: 200,
  },
});

export const enqueueDocument = async (data: DocumentJobData): Promise<void> => {
  try {
    await documentQueue.add('embed-document', data);
    logger.info(
      `[DocumentQueue] Enqueued "${data.originalName}" (${data.fileType}) → doc=${data.documentId}`,
    );
  } catch (error) {
    logger.error('[DocumentQueue] Failed to enqueue document:', error);
    throw error;
  }
};

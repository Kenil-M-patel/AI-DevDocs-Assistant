import { Worker, Job } from 'bullmq';
import { OllamaEmbeddings } from '@langchain/ollama';
import { PGVectorStore } from '@langchain/pgvector';
import { Pool } from 'pg';
import logger from '../lib/logger';
import * as RedisUtils from '../lib/redis.utils';
import config from '../config/config';
import { DocumentJobData } from '../queues/document.queue';
import { runIngester } from '../services/ingestion/index';
import { Document } from '../models/document.model';

// ─── PGVector DB pool ──────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: config.VECTOR_DB_URL,
});

// ─── PGVector table config ─────────────────────────────────────────────────────
const VECTOR_STORE_CONFIG = {
  pool,
  tableName: 'document_embeddings',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'embedding',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
};

/**
 * Updates the document status in Postgres.
 * Called at each lifecycle stage (processing → ready | failed).
 */
async function updateDocumentStatus(
  documentId: string,
  status: 'processing' | 'ready' | 'failed',
  extras: { chunkCount?: number; errorMessage?: string } = {},
): Promise<void> {
  try {
    await Document.update(
      {
        status,
        ...(extras.chunkCount !== undefined && { chunkCount: extras.chunkCount }),
        ...(extras.errorMessage !== undefined && { errorMessage: extras.errorMessage }),
      },
      { where: { id: documentId } },
    );
  } catch (err: any) {
    logger.warn(`[DocumentWorker] Could not update document ${documentId} status: ${err.message}`);
  }
}

/**
 * Multi-Format Document Embedding Worker
 *
 * Listens on the "document-embedding-queue" and for each job:
 *   1. Marks document as "processing" in Postgres
 *   2. Delegates to the appropriate ingester (pdf / markdown / swagger / code / text)
 *   3. Generates embeddings via Ollama (nomic-embed-text)
 *   4. Stores all chunks in PGVector with project-scoped metadata
 *   5. Marks document as "ready" (or "failed" on error) in Postgres
 */
RedisUtils.connectToRedis()
  .then(() => {
    // Import models so associations are registered before we call Document.update()
    import('../models/index').then(() => {
      const worker = new Worker<DocumentJobData>(
        'document-embedding-queue',
        async (job: Job<DocumentJobData>) => {
          const { fileUrl, documentId, projectId, fileType, originalName } = job.data;

          logger.info(
            `[DocumentWorker] Job ${job.id} — "${originalName}" (${fileType}) → doc=${documentId}`,
          );

          // Step 1: mark as processing
          await updateDocumentStatus(documentId, 'processing');

          try {
            // Step 2: run the correct ingester
            const chunks = await runIngester(fileUrl, fileType, {
              projectId,
              documentId,
              filename: fileUrl.split(/[\\/]/).pop() ?? fileUrl,
              originalName,
              fileType,
            });

            logger.info(
              `[DocumentWorker] Ingested ${chunks.length} chunks from "${originalName}"`,
            );

            // Step 3: initialize embeddings
            const embeddings = new OllamaEmbeddings({
              model: config.OLLAMA_EMBED_MODEL,
              baseUrl: config.OLLAMA_BASE_URL,
            });

            // Step 4: store in PGVector
            const vectorStore = await PGVectorStore.initialize(embeddings, VECTOR_STORE_CONFIG);
            await vectorStore.addDocuments(chunks);

            logger.info(
              `[DocumentWorker] Stored ${chunks.length} embeddings for doc=${documentId}`,
            );

            // Step 5: mark as ready
            await updateDocumentStatus(documentId, 'ready', { chunkCount: chunks.length });
          } catch (error: any) {
            logger.error(
              `[DocumentWorker] Job ${job.id} failed for doc=${documentId}: ${error.message}`,
            );
            await updateDocumentStatus(documentId, 'failed', { errorMessage: error.message });
            throw error; // re-throw so BullMQ records the failure and retries
          }
        },
        {
          connection: RedisUtils.getRedisConnection(),
          concurrency: 3, // process up to 3 documents simultaneously
        },
      );

      worker.on('completed', (job) => {
        logger.info(`[DocumentWorker] Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        logger.error(`[DocumentWorker] Job ${job?.id} permanently failed: ${err.message}`);
      });

      worker.on('error', (err) => {
        logger.error(`[DocumentWorker] Worker error: ${err.message}`);
      });

      logger.info('[DocumentWorker] Started — listening for document embedding jobs');
    });
  })
  .catch((err) => {
    logger.error('[DocumentWorker] Failed to connect to Redis:', err);
  });

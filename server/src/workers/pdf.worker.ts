import { Worker, Job } from 'bullmq';
import { OllamaEmbeddings } from '@langchain/ollama';
import { PGVectorStore } from '@langchain/pgvector';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Pool } from 'pg';
import logger from '../lib/logger';
import * as RedisUtils from '../lib/redis.utils';
import config from '../config/config';

// Database configuration for PGVector
const pgConfig = {
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  host: 'pgvector-db', // Container name in docker-compose
  database: 'vector_db',
  port: 5432,
};

const pool = new Pool(pgConfig);

/**
 * PDF Embedding Worker
 * Processes PDF files from the queue, chunks them, generates embeddings using Ollama,
 * and stores them in PGVector.
 */
RedisUtils.connectToRedis()
  .then(() => {
    const pdfWorker = new Worker(
      'pdf-embedding-queue',
      async (job: Job) => {
        const { id } = job;
        const { fileUrl } = job.data; // This is the local path to the PDF

        logger.info(`[Worker] Starting PDF embedding job ${id} for file: ${fileUrl}`);

        try {
          // 1. Load the PDF
          const loader = new PDFLoader(fileUrl);
          const rawDocs = await loader.load();
          logger.info(`[Worker] Loaded ${rawDocs.length} pages from PDF`);

          // 2. Split text into chunks
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
          });
          const docs = await textSplitter.splitDocuments(rawDocs);
          logger.info(`[Worker] Split PDF into ${docs.length} chunks`);

          // 3. Initialize Ollama Embeddings
          const embeddings = new OllamaEmbeddings({
            model: config.OLLAMA_EMBED_MODEL,
            baseUrl: config.OLLAMA_BASE_URL,
          });

          // 4. Initialize PGVector Store and add documents
          const vectorStore = await PGVectorStore.initialize(embeddings, {
            pool: pool,
            tableName: 'pdf_embeddings',
            columns: {
              idColumnName: 'id',
              vectorColumnName: 'embedding',
              contentColumnName: 'content',
              metadataColumnName: 'metadata',
            },
          });

          await vectorStore.addDocuments(docs);
          logger.info(`[Worker] Successfully stored ${docs.length} chunks in PGVector`);
        } catch (error: any) {
          logger.error(`[Worker] Error processing job ${id}: ${error.message}`);
          throw error;
        }
      },
      {
        connection: RedisUtils.getRedisConnection(),
        concurrency: 5,
      },
    );

    pdfWorker.on('completed', (job) => {
      logger.info(`[Worker] Job ${job.id} has completed successfully`);
    });

    pdfWorker.on('failed', (job, err) => {
      logger.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });

    logger.info('PDF Embedding Worker started and listening for jobs');
  })
  .catch((err) => {
    logger.error('Failed to connect to Redis for PDF Worker:', err);
  });

import { OllamaEmbeddings, ChatOllama } from '@langchain/ollama';
import { PGVectorStore } from '@langchain/pgvector';
import { Pool } from 'pg';
import logger from '../lib/logger';
import config from '../config/config';

export class ChatService {
  private pool: Pool;
  private embeddings: OllamaEmbeddings;
  private llm: ChatOllama;

  constructor() {
    // Database pool for PGVector
    this.pool = new Pool({
      user: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      host: 'pgvector-db',
      database: 'vector_db',
      port: 5432,
    });

    // Initialize Embeddings
    this.embeddings = new OllamaEmbeddings({
      model: config.OLLAMA_EMBED_MODEL,
      baseUrl: config.OLLAMA_BASE_URL,
    });

    // Initialize LLM
    this.llm = new ChatOllama({
      model: config.OLLAMA_LLM_MODEL,
      baseUrl: config.OLLAMA_BASE_URL,
      temperature: 0.7,
    });
  }

  async chat(userQuery: string) {
    try {
      // 1. Initialize Vector Store
      const vectorStore = await PGVectorStore.initialize(this.embeddings, {
        pool: this.pool,
        tableName: 'pdf_embeddings',
        columns: {
          idColumnName: 'id',
          vectorColumnName: 'embedding',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
      });

      // 2. Retrieve relevant context
      const retriever = vectorStore.asRetriever({
        k: 3,
      });
      const relevantDocs = await retriever.invoke(userQuery);

      const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');

      // 3. Build System Prompt
      const SYSTEM_PROMPT = `
      You are a helpful AI Assistant who answers the user query based on the available context from PDF Files.
      If the answer is not in the context, say that you don't know based on the provided documents.
      
      Context:
      ${context}
      `;

      // 4. Call Llama3
      const response = await this.llm.invoke([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuery },
      ]);

      return {
        answer: response.content,
        sources: relevantDocs.map((doc) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
        })),
      };
    } catch (error: any) {
      logger.error(`Error in ChatService: ${error.message}`);
      throw error;
    }
  }
}

export default new ChatService();

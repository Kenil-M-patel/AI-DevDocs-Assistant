import path from 'path';
import { Document } from '@langchain/core/documents';
import { DocumentType } from '../../models/document.model';
import { ingestPdf } from './pdf.ingester';
import { ingestMarkdown } from './markdown.ingester';
import { ingestSwagger } from './swagger.ingester';
import { ingestCode } from './code.ingester';
import { ingestText } from './text.ingester';

/**
 * Metadata attached to every chunk stored in PGVector.
 * This allows retrieval to be scoped to a specific project/document.
 */
export interface ChunkMetadata {
  projectId: string;
  documentId: string;
  filename: string;
  originalName: string;
  fileType: DocumentType;
  chunkIndex: number;
  source: string;
  [key: string]: unknown; // allow ingester-specific extras (e.g. language, page)
}

/**
 * File extension → DocumentType mapping.
 * Used both by the upload handler and the factory.
 */
export const EXTENSION_TO_TYPE: Record<string, DocumentType> = {
  '.pdf':  'pdf',
  '.md':   'markdown',
  '.mdx':  'markdown',
  '.yaml': 'swagger',
  '.yml':  'swagger',
  '.json': 'swagger',   // will be treated as swagger; falls back to text if invalid
  '.ts':   'code',
  '.tsx':  'code',
  '.js':   'code',
  '.jsx':  'code',
  '.py':   'code',
  '.java': 'code',
  '.go':   'code',
  '.rs':   'code',
  '.cpp':  'code',
  '.cc':   'code',
  '.cs':   'code',
  '.rb':   'code',
  '.txt':  'text',
};

/**
 * Derive a DocumentType from a file path.
 * Falls back to 'text' for unrecognised extensions.
 */
export function detectDocumentType(filePath: string): DocumentType {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_TYPE[ext] ?? 'text';
}

/**
 * Central ingestion factory.
 *
 * Given a file path + rich metadata, delegates to the appropriate ingester
 * and returns an array of LangChain Documents ready for embedding.
 *
 * Falls back to the text ingester when swagger-parser rejects a JSON/YAML file
 * that isn't actually an OpenAPI spec.
 */
export async function runIngester(
  filePath: string,
  fileType: DocumentType,
  chunkMetadata: Omit<ChunkMetadata, 'chunkIndex' | 'source'>,
): Promise<Document[]> {
  const base: Record<string, unknown> = { ...chunkMetadata };

  try {
    switch (fileType) {
      case 'pdf':
        return await ingestPdf(filePath, base);

      case 'markdown':
        return await ingestMarkdown(filePath, base);

      case 'swagger':
        return await ingestSwagger(filePath, base);

      case 'code':
        return await ingestCode(filePath, base);

      case 'text':
      default:
        return await ingestText(filePath, base);
    }
  } catch (err: any) {
    // If swagger parsing fails (not a valid spec), fall back to text
    if (fileType === 'swagger') {
      console.warn(
        `[IngesterFactory] Swagger parse failed for ${filePath}, falling back to text: ${err.message}`,
      );
      return await ingestText(filePath, base);
    }
    throw err;
  }
}

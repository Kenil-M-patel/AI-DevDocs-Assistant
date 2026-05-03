import fs from 'fs';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Plain-text Ingester
 * Fallback for .txt and other unrecognised text formats.
 */
export async function ingestText(
  filePath: string,
  baseMetadata: Record<string, unknown> = {},
): Promise<Document[]> {
  const content = fs.readFileSync(filePath, 'utf-8');

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const rawDocs = [
    new Document({
      pageContent: content,
      metadata: { source: filePath },
    }),
  ];

  const chunks = await splitter.splitDocuments(rawDocs);

  return chunks.map((doc, i) => ({
    ...doc,
    metadata: {
      ...baseMetadata,
      ...doc.metadata,
      chunkIndex: i,
      source: filePath,
    },
  }));
}

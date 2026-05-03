import fs from 'fs';
import { Document } from '@langchain/core/documents';
import { MarkdownTextSplitter } from '@langchain/textsplitters';

/**
 * Markdown Ingester
 * Splits markdown files at heading boundaries so each chunk stays semantically coherent.
 */
export async function ingestMarkdown(
  filePath: string,
  baseMetadata: Record<string, unknown> = {},
): Promise<Document[]> {
  const content = fs.readFileSync(filePath, 'utf-8');

  const splitter = new MarkdownTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100,
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

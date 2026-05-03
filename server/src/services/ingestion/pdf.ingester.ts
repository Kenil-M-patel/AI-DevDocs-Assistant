import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

/**
 * PDF Ingester
 * Loads a PDF file, extracts text page-by-page, and splits into overlapping chunks.
 */
export async function ingestPdf(
  filePath: string,
  baseMetadata: Record<string, unknown> = {},
): Promise<Document[]> {
  const loader = new PDFLoader(filePath, { splitPages: true });
  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(rawDocs);

  // Enrich each chunk with caller-supplied metadata + chunk index
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

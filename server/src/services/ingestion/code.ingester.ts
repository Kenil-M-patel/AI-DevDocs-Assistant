import fs from 'fs';
import path from 'path';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Code Ingester
 * Uses language-aware RecursiveCharacterTextSplitter so splits happen at
 * logical boundaries (functions, classes) rather than mid-statement.
 *
 * Supported extensions → LangChain language token:
 *   .ts .tsx → typescript
 *   .js .jsx → js
 *   .py       → python
 *   .java     → java
 *   .go       → go
 *   .rs       → rust
 *   .cpp .cc .cxx .h → cpp
 *   .cs       → csharp
 *   .rb       → ruby
 *   everything else → plain RecursiveCharacterTextSplitter
 */
const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'js',
  '.jsx': 'js',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.h': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
};

export async function ingestCode(
  filePath: string,
  baseMetadata: Record<string, unknown> = {},
): Promise<Document[]> {
  const ext = path.extname(filePath).toLowerCase();
  const language = EXT_TO_LANG[ext];
  const content = fs.readFileSync(filePath, 'utf-8');

  let splitter: RecursiveCharacterTextSplitter;

  if (language) {
    splitter = RecursiveCharacterTextSplitter.fromLanguage(language as any, {
      chunkSize: 1500,
      chunkOverlap: 150,
    });
  } else {
    splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 150,
    });
  }

  const rawDocs = [
    new Document({
      pageContent: content,
      metadata: { source: filePath, language: language ?? 'unknown', fileExtension: ext },
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

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type DocumentType = 'pdf' | 'markdown' | 'swagger' | 'code' | 'text';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  documents?: DocRecord[];
}

export interface DocRecord {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  type: DocumentType;
  status: DocumentStatus;
  chunkCount: number;
  errorMessage?: string | null;
  createdAt: string;
}

export interface Source {
  content: string;
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
  isLoading?: boolean;
}

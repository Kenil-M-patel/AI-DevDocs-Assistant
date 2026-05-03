import type { DocRecord, Project, Source } from './types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `API error ${res.status}`);
  }
  return json.data as T;
}

// ─── Projects ──────────────────────────────────────────────────────────────────
export const projectApi = {
  list: () => apiFetch<Project[]>('/projects'),

  create: (name: string, description?: string) =>
    apiFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  delete: (id: string) =>
    fetch(`${BASE}/projects/${id}`, { method: 'DELETE' }).then((r) => r.json()),
};

// ─── Documents ─────────────────────────────────────────────────────────────────
export const documentApi = {
  list: (projectId: string) =>
    apiFetch<DocRecord[]>(`/projects/${projectId}/documents`),

  upload: async (projectId: string, file: File): Promise<DocRecord> => {
    const form = new FormData();
    form.append('document', file);
    const res = await fetch(`${BASE}/projects/${projectId}/documents`, {
      method: 'POST',
      body: form, // no Content-Type header — browser sets multipart boundary
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed');
    return json.data as DocRecord;
  },

  delete: (projectId: string, documentId: string) =>
    fetch(`${BASE}/projects/${projectId}/documents/${documentId}`, {
      method: 'DELETE',
    }).then((r) => r.json()),

  reprocess: (projectId: string, documentId: string) =>
    apiFetch<DocRecord>(`/projects/${projectId}/documents/${documentId}/reprocess`, {
      method: 'POST',
    }),
};

// ─── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatResponse {
  answer: unknown;
  sources: Source[];
}

export const chatApi = {
  ask: async (message: string, _projectId?: string): Promise<ChatResponse> => {
    const res = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Chat failed');
    return json as ChatResponse;
  },
};

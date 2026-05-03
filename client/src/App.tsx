import { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { projectApi, documentApi, chatApi } from './api';
import type { Project, DocRecord, ChatMessage, Source } from './types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2);

const TYPE_ICON: Record<string, string> = {
  pdf: '📄', markdown: '📝', swagger: '🔌', code: '💻', text: '📃',
};

const TYPE_ACCEPT =
  '.pdf,.md,.mdx,.yaml,.yml,.json,.ts,.tsx,.js,.jsx,.py,.java,.go,.rs,.cpp,.cs,.rb,.txt';

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, kind }: { msg: string; kind: 'error' | 'success' }) {
  return <div className={`toast ${kind}`}>{msg}</div>;
}

// ─── Source Drawer ────────────────────────────────────────────────────────────

function SourcesBlock({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;
  return (
    <div>
      <button className="sources-toggle" onClick={() => setOpen((o) => !o)}>
        <span>{open ? '▾' : '▸'}</span>
        {sources.length} source{sources.length > 1 ? 's' : ''} used
      </button>
      {open && (
        <div className="sources-list" style={{ marginTop: 8 }}>
          {sources.map((s, i) => (
            <div className="source-item" key={i}>
              {s.metadata?.originalName && (
                <div className="source-meta">
                  📎 {String(s.metadata.originalName)}
                  {s.metadata.chunkIndex !== undefined && ` · chunk ${s.metadata.chunkIndex}`}
                </div>
              )}
              {s.content.slice(0, 300)}{s.content.length > 300 ? '…' : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────

function MessageRow({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

  return (
    <div className={`message-row ${msg.role}`}>
      <div className={`avatar ${msg.role}`}>{isUser ? '👤' : '🤖'}</div>
      <div className="message-body">
        <div className="message-bubble">
          {msg.isLoading ? (
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          ) : content}
        </div>
        {!msg.isLoading && msg.sources && <SourcesBlock sources={msg.sources} />}
        <span className="message-time">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Document Item ────────────────────────────────────────────────────────────

function DocItem({
  doc,
  onDelete,
  onReprocess,
}: {
  doc: DocRecord;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}) {
  return (
    <div className="doc-item">
      <div className={`doc-type-icon ${doc.type}`}>{TYPE_ICON[doc.type] ?? '📄'}</div>
      <div className="doc-info">
        <div className="doc-name" title={doc.originalName}>{doc.originalName}</div>
        <div className="doc-meta">
          {formatDate(doc.createdAt)}
          {doc.status === 'ready' && doc.chunkCount > 0 && (
            <span className="chunk-count"> · {doc.chunkCount} chunks</span>
          )}
        </div>
      </div>
      <span className={`status-badge ${doc.status}`}>{doc.status}</span>
      <div className="doc-actions">
        {doc.status === 'failed' && (
          <button className="doc-action-btn" title="Retry" onClick={() => onReprocess(doc.id)}>↺</button>
        )}
        <button className="doc-action-btn danger" title="Delete" onClick={() => onDelete(doc.id)}>✕</button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Documents
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; kind: 'error' | 'success' } | null>(null);

  const showToast = useCallback((msg: string, kind: 'error' | 'success' = 'error') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load projects on mount ──────────────────────────────────────────────────
  useEffect(() => {
    projectApi.list()
      .then((p) => {
        setProjects(p);
        if (p.length > 0) setActiveProject(p[0]);
      })
      .catch(() => showToast('Could not reach server — is the backend running?'))
      .finally(() => setProjectsLoading(false));
  }, [showToast]);

  // ── Load documents when project changes ────────────────────────────────────
  useEffect(() => {
    if (!activeProject) { setDocs([]); return; }
    documentApi.list(activeProject.id)
      .then(setDocs)
      .catch(() => showToast('Failed to load documents'));
  }, [activeProject, showToast]);

  // ── Poll processing docs every 4 s ─────────────────────────────────────────
  useEffect(() => {
    if (!activeProject) return;
    const hasProcessing = docs.some((d) => d.status === 'pending' || d.status === 'processing');
    if (!hasProcessing) return;
    const t = setTimeout(() => {
      documentApi.list(activeProject.id).then(setDocs).catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, [docs, activeProject]);

  // ── Scroll chat to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // ─── Create project ─────────────────────────────────────────────────────────
  const handleCreateProject = async () => {
    if (!newName.trim()) return;
    try {
      const p = await projectApi.create(newName.trim(), newDesc.trim() || undefined);
      setProjects((prev) => [p, ...prev]);
      setActiveProject(p);
      setNewName(''); setNewDesc('');
      setShowNewProject(false);
      showToast('Project created!', 'success');
    } catch (e: any) {
      showToast(e.message);
    }
  };

  // ─── Upload files ───────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || !activeProject) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const doc = await documentApi.upload(activeProject.id, file);
        setDocs((prev) => [doc, ...prev]);
        ok++;
      } catch (e: any) {
        showToast(`Upload failed: ${e.message}`);
      }
    }
    setUploading(false);
    if (ok > 0) showToast(`${ok} file${ok > 1 ? 's' : ''} queued for processing`, 'success');
  };

  // ─── Delete doc ─────────────────────────────────────────────────────────────
  const handleDeleteDoc = async (docId: string) => {
    if (!activeProject) return;
    await documentApi.delete(activeProject.id, docId);
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  // ─── Reprocess doc ──────────────────────────────────────────────────────────
  const handleReprocess = async (docId: string) => {
    if (!activeProject) return;
    try {
      const updated = await documentApi.reprocess(activeProject.id, docId);
      setDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast('Re-queued for processing', 'success');
    } catch (e: any) {
      showToast(e.message);
    }
  };

  // ─── Send chat message ───────────────────────────────────────────────────────
  const handleSend = async () => {
    const query = input.trim();
    if (!query || chatLoading) return;

    const userMsg: ChatMessage = {
      id: uid(), role: 'user', content: query, timestamp: new Date(),
    };
    const loadingMsg: ChatMessage = {
      id: uid(), role: 'assistant', content: '', timestamp: new Date(), isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    setChatLoading(true);

    try {
      const res = await chatApi.ask(query, activeProject?.id);
      const answerText = typeof res.answer === 'string'
        ? res.answer
        : JSON.stringify(res.answer);

      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: answerText,
        sources: res.sources ?? [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: uid(), role: 'assistant',
          content: `⚠️ ${e.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  const readyDocs = docs.filter((d) => d.status === 'ready').length;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">⚡</div>
          <span className="header-logo-text">AI DevDocs Assistant</span>
        </div>
        <div className="header-divider" />

        {projectsLoading ? (
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading projects…</span>
        ) : (
          <>
            <select
              className="project-select"
              value={activeProject?.id ?? ''}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value) ?? null;
                setActiveProject(p);
                setMessages([]);
              }}
            >
              {projects.length === 0 && <option value="">— No projects —</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '7px 12px' }}
              onClick={() => setShowNewProject((v) => !v)}
            >
              {showNewProject ? '✕ Cancel' : '+ New Project'}
            </button>
          </>
        )}

        {activeProject && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {readyDocs} / {docs.length} docs ready
          </span>
        )}
      </header>

      {/* ── New project form (inline below header) ── */}
      {showNewProject && (
        <div style={{
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          background: 'rgba(99,102,241,0.04)', display: 'flex', gap: 8, alignItems: 'center',
          animation: 'slideDown 0.2s ease',
        }}>
          <input
            className="input" style={{ maxWidth: 220 }}
            placeholder="Project name *"
            value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
            autoFocus
          />
          <input
            className="input" style={{ maxWidth: 280 }}
            placeholder="Description (optional)"
            value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
          />
          <button className="btn btn-primary" onClick={handleCreateProject} disabled={!newName.trim()}>
            Create
          </button>
        </div>
      )}

      <div className="main">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* Upload zone */}
          <div className="sidebar-section">
            <div className="section-label">Upload Documents</div>

            {!activeProject ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
                Create or select a project first
              </div>
            ) : (
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <input
                  type="file"
                  multiple
                  accept={TYPE_ACCEPT}
                  disabled={uploading}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="upload-zone-icon">
                  {uploading ? <span className="spinner" style={{ width: 24, height: 24 }} /> : '⬆️'}
                </div>
                <div className="upload-zone-title">
                  {uploading ? 'Uploading…' : 'Drop files or click to browse'}
                </div>
                <div className="upload-zone-sub">Supports PDF, Markdown, Swagger/OpenAPI, code files, and plain text</div>
                <div className="upload-zone-types">
                  {['pdf', 'md', 'yaml', 'json', 'ts', 'py', 'txt'].map((t) => (
                    <span className="type-badge" key={t}>.{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Document list */}
          {activeProject && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="sidebar-section" style={{ paddingBottom: 12 }}>
                <div className="section-label">
                  Documents
                  {docs.length > 0 && (
                    <span style={{ marginLeft: 6, color: 'var(--text-faint)' }}>({docs.length})</span>
                  )}
                </div>
              </div>
              <div className="doc-list">
                {docs.length === 0 && (
                  <div className="doc-list-empty">No documents yet.<br />Upload one above to get started.</div>
                )}
                {docs.map((doc) => (
                  <DocItem
                    key={doc.id}
                    doc={doc}
                    onDelete={handleDeleteDoc}
                    onReprocess={handleReprocess}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Chat Panel ── */}
        <section className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">
                {activeProject ? `💬 Chat with ${activeProject.name}` : 'Chat'}
              </div>
              {activeProject && (
                <div className="chat-header-sub">
                  {readyDocs > 0
                    ? `Searching across ${readyDocs} indexed document${readyDocs > 1 ? 's' : ''}`
                    : 'Index some documents to enable contextual answers'}
                </div>
              )}
            </div>
            {messages.length > 0 && (
              <button
                className="btn btn-ghost"
                style={{ marginLeft: 'auto', fontSize: 12 }}
                onClick={() => setMessages([])}
              >
                Clear chat
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">🔍</div>
                <div className="chat-empty-title">Ask anything about your docs</div>
                <div className="chat-empty-sub">
                  {activeProject
                    ? 'Type a question below — the AI will search your indexed documents and cite sources'
                    : 'Create a project and upload documents to begin'}
                </div>
              </div>
            ) : (
              messages.map((m) => <MessageRow key={m.id} msg={m} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder={
                  activeProject
                    ? 'Ask a question about your documents… (Enter to send, Shift+Enter for new line)'
                    : 'Create a project first…'
                }
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!activeProject || chatLoading}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim() || chatLoading || !activeProject}
                title="Send (Enter)"
              >
                {chatLoading ? <span className="spinner" /> : '↑'}
              </button>
            </div>
            <div className="chat-hint">
              {readyDocs === 0 && activeProject
                ? '⚠️ No ready documents — upload and index files to get contextual answers'
                : 'Powered by Ollama · responses grounded in your uploaded documents'}
            </div>
          </div>
        </section>
      </div>

      {toast && <Toast msg={toast.msg} kind={toast.kind} />}
    </div>
  );
}

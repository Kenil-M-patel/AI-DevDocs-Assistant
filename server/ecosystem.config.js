module.exports = {
  apps: [
    // RAG-CHAT BACKEND
    {
      name: 'rag-chat-backend',
      script: 'dest/cjs/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },

    // PDF EMBEDDING WORKER
    {
      name: 'pdf-embedding-worker',
      script: 'dest/cjs/workers/pdf.worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

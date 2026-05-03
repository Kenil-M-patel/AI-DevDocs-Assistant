# AI DevDocs Assistant - Server

The backend for the AI DevDocs Assistant, powered by Express, LangChain, and BullMQ.

## 🚀 Features
- **Document Ingestion**: PDF and Swagger parsing.
- **RAG Pipeline**: LangChain integration with Ollama.
- **Background Jobs**: BullMQ for processing heavy embedding tasks.
- **Vector Search**: PGVector for fast similarity search.

## 🛠️ Setup
1. Copy `.env.example` to `.env` (or use the one provided in root).
2. Start services: `docker-compose up -d`.
3. Install dependencies: `npm install`.
4. Build: `npm run build`.
5. Start: `npm run start`.

## 📂 Structure
- `src/controllers`: API endpoints.
- `src/services`: PDF/Swagger processing logic.
- `src/workers`: Background workers for embeddings.
- `src/models`: Sequelize database models.
- `src/lib`: AI and Vector store initialization.
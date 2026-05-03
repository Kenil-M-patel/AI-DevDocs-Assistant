# AI DevDocs Assistant

AI DevDocs Assistant is a powerful RAG (Retrieval-Augmented Generation) based platform designed to help developers interact with documentation. By uploading PDFs or Swagger/OpenAPI specifications, users can instantly query their documentation using a local LLM, making knowledge discovery faster and more intuitive.

---

## 🚀 Key Features

- **Multi-Format Ingestion**: Support for PDF documents and Swagger/OpenAPI (YAML/JSON) specifications.
- **RAG-Powered Chat**: Uses LangChain and Vector embeddings to provide context-aware answers.
- **Local AI Sovereignty**: Integrated with Ollama for running LLMs and embedding models locally.
- **Asynchronous Processing**: Background workers powered by BullMQ handle document chunking and embedding generation.
- **Modern UI**: A responsive React-Vite dashboard for managing documents and chatting.

---

## 🏗️ Architecture & Flow

The system follows a modern RAG architecture:

```mermaid
graph TD
    User((User)) -->|Uploads Docs| Client[React Frontend]
    Client -->|API Request| Server[Express Backend]
    Server -->|Store Metadata| Postgres[(PostgreSQL)]
    Server -->|Add Job| Redis[Redis Queue]
    Redis -->|Process| Worker[BullMQ Worker]
    Worker -->|Chunk & Embed| Ollama[Ollama LLM]
    Worker -->|Store Vectors| PGVector[(PGVector DB)]
    
    User -->|Asks Question| Client
    Client -->|Chat Request| Server
    Server -->|Search Similar| PGVector
    PGVector -->|Context| Server
    Server -->|Context + Query| Ollama
    Ollama -->|AI Response| Server
    Server -->|Response| Client
```

---

## 🛠️ Tech Stack

- **Frontend**: React (v19), Vite, TypeScript, CSS3
- **Backend**: Node.js, Express, TypeScript
- **AI Framework**: LangChain
- **LLM/Embeddings**: Ollama (`phi3`, `nomic-embed-text`)
- **Database**: 
  - PostgreSQL (Relational metadata)
  - PGVector (Vector embeddings)
- **Caching/Queue**: Redis & BullMQ
- **ORM**: Sequelize

---

## 📂 Project Structure

```text
AI-DevDocs-Assistant/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api.ts          # API communication layer
│   │   ├── App.tsx         # Main UI logic
│   │   └── index.css       # Global styles
│   └── package.json
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # API Request Handlers
│   │   ├── services/       # Business Logic (PDF, Swagger processing)
│   │   ├── workers/        # BullMQ Background Workers
│   │   ├── models/         # Sequelize Models
│   │   ├── lib/            # AI & Vector Store initializers
│   │   └── server.ts       # Entry Point
│   ├── docker-compose.yaml # DB, Vector DB, Redis setup
│   └── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Docker**: For running databases and Redis
- **Ollama**: Installed and running on your local machine

### 2. Environment Setup

#### Server (`/server/.env`)
Create a `.env` file in the `server` directory:
```env
PORT=5000
DATABASE_HOST=localhost
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=app_db
REDIS_URL="redis://localhost:6379"
VECTOR_DB_URL=postgresql://postgres:postgres@localhost:5433/vector_db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=phi3
```
*Note: If running the app inside Docker, use `host.docker.internal` for Ollama and service names for DBs.*

#### Client (`/client/.env`)
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Database & Services
Start the required services using Docker:
```bash
cd server
docker-compose up -d
```

### 4. Ollama Models
Pull the required models:
```bash
ollama pull phi3
ollama pull nomic-embed-text
```

### 5. Backend Installation
```bash
cd server
npm install
npm run build
npm run start
```

### 6. Frontend Installation
```bash
cd client
npm install
npm run dev
```

---

## 🔄 System Flow Detail

1. **Ingestion**:
   - User uploads a file (PDF or Swagger).
   - Backend saves the file and creates a `Processing` record in PostgreSQL.
   - A job is added to the BullMQ queue.
2. **Processing**:
   - The Worker picks up the job.
   - Files are parsed (`pdf-parse` for PDFs, `js-yaml` for Swagger).
   - Content is chunked using LangChain splitters.
   - Chunks are converted to embeddings via Ollama.
   - Embeddings are stored in PGVector.
3. **Querying**:
   - User sends a chat message.
   - Backend generates an embedding for the user message.
   - Similarity search is performed in PGVector.
   - The most relevant chunks are retrieved and passed to the LLM as context.
   - The LLM generates a response based on the documentation.

---

## 📜 License
This project is licensed under the ISC License.

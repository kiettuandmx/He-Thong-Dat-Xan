# GraphRAG Service

This service is a separate Python service for the user recommendation chat.

Responsibilities:
- parse user recommendation queries
- normalize recommendation constraints
- query Neo4j for candidate fields
- assemble curated FAQ and policy context
- call OpenRouter for final grounded explanations

Non-responsibilities:
- booking creation
- payment processing
- user authentication
- replacing the Node backend

Main local endpoint:
- `POST /chat`

## Local startup

### 1. Start the Node backend

```bash
cd backend
npm install
npm run dev
```

### 2. Start the Python GraphRAG service

```bash
cd graphrag-service
C:\laragon6.0\bin\python\python-3.10\python.exe -m pip install -r requirements.txt
C:\laragon6.0\bin\python\python-3.10\python.exe -m uvicorn app.main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

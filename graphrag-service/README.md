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


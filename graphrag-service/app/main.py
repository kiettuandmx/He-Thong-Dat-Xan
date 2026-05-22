from fastapi import FastAPI

from .config import settings
from .schemas import ChatRequest, ChatResponse, HealthResponse
from .services.chat_service import generate_chat_response
from .services.graph_repository import GraphRepository
from .services.openrouter_client import OpenRouterClient

app = FastAPI(title="GraphRAG Service", version="0.1.0")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    repository = GraphRepository(
        settings.neo4j_uri,
        settings.neo4j_username,
        settings.neo4j_password,
    )
    try:
        result = generate_chat_response(
            request=request,
            repository=repository,
            llm_client=OpenRouterClient(
                api_key=settings.openrouter_api_key,
                model=settings.openrouter_model,
            ),
        )
        return ChatResponse(**result)
    finally:
        repository.close()

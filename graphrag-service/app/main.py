from fastapi import FastAPI

from .schemas import HealthResponse

app = FastAPI(title="GraphRAG Service", version="0.1.0")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")

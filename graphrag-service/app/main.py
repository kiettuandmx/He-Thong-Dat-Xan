import json

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse

from .config import settings
from .schemas import ChatRequest, ChatResponse, HealthResponse
from .services.chat_service import generate_chat_response, prepare_chat_turn
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
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    finally:
        repository.close()


@app.post("/chat/stream")
def chat_stream(request: ChatRequest) -> StreamingResponse:
    repository = GraphRepository(
        settings.neo4j_uri,
        settings.neo4j_username,
        settings.neo4j_password,
    )
    llm_client = OpenRouterClient(
        api_key=settings.openrouter_api_key,
        model=settings.openrouter_model,
    )

    try:
        turn = prepare_chat_turn(
            request=request,
            repository=repository,
            llm_client=llm_client,
        )
    finally:
        repository.close()

    def event_stream():
        yield _sse_event("meta", {"constraints": turn["constraints"].model_dump()})

        if turn["mode"] == "direct_reply":
            answer = turn["answer"].strip()
            if answer:
                yield _sse_event("token", {"content": answer})
            yield _sse_event(
                "done",
                {
                    "answer": answer,
                    "recommendations": [],
                    "constraints": turn["constraints"].model_dump(),
                },
            )
            return

        if turn["mode"] == "clarification":
            try:
                result = llm_client.generate_recommendation(turn["payload"])
                answer = (result.get("answer") or "").strip()
                if answer:
                    yield _sse_event("token", {"content": answer})
                yield _sse_event(
                    "done",
                    {
                        "answer": answer,
                        "recommendations": [],
                        "constraints": turn["constraints"].model_dump(),
                    },
                )
            except RuntimeError as error:
                yield _sse_event("error", {"message": str(error)})
            return

        try:
            result = llm_client.generate_recommendation(turn["payload"])
            answer = (result.get("answer") or "").strip()
            if answer:
                yield _sse_event("token", {"content": answer})
            yield _sse_event(
                "done",
                {
                    "answer": answer,
                    "recommendations": result.get("recommendations")
                    or turn["payload"]["candidate_fields"],
                    "constraints": turn["constraints"].model_dump(),
                },
            )
        except RuntimeError as error:
            yield _sse_event("error", {"message": str(error)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _sse_event(event_name: str, payload: dict) -> str:
    return f"event: {event_name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"

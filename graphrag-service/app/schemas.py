from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class RecommendationConstraints(BaseModel):
    area: str | None = None
    group_size: int | None = None
    price_band: str | None = None
    price_sort: str | None = None
    time_preference: str | None = None
    field_type: str | None = None
    amenities: list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    recommendations: list[dict]
    constraints: RecommendationConstraints

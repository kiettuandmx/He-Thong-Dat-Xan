from app.schemas import RecommendationConstraints


def build_chat_context(constraints: RecommendationConstraints, candidate_fields: list[dict]) -> dict:
    return {
        "constraints": constraints.model_dump(),
        "candidate_fields": candidate_fields,
    }


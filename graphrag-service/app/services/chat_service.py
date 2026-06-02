from app.services.context_builder import build_chat_context
from app.services.constraint_extractor import extract_recommendation_constraints
from app.services.scope_guardrail import classify_scope


def build_chat_payload(request, repository, llm_client):
    constraints = extract_recommendation_constraints(request.message, llm_client)
    candidate_fields = repository.find_candidate_fields(constraints.model_dump())
    payload = build_chat_context(constraints=constraints, candidate_fields=candidate_fields)
    return constraints, payload


def prepare_chat_turn(request, repository, llm_client):
    constraints = extract_recommendation_constraints(request.message, llm_client)
    scope_result = classify_scope(request.message, llm_client)

    if scope_result["status"] in {"out_of_scope", "needs_clarification"}:
        return {
            "mode": "direct_reply",
            "answer": scope_result["reply"],
            "recommendations": [],
            "constraints": constraints,
        }

    if not _has_actionable_constraints(constraints):
        return {
            "mode": "clarification",
            "constraints": constraints,
            "payload": {
                "response_mode": "needs_clarification",
                "message": request.message,
                "constraints": constraints.model_dump(),
                "candidate_fields": [],
                "available_suggestions": [],
            },
        }

    candidate_fields = repository.find_candidate_fields(constraints.model_dump())
    payload = build_chat_context(constraints=constraints, candidate_fields=candidate_fields)
    return {
        "mode": "recommendation",
        "constraints": constraints,
        "payload": payload,
    }


def _find_available_suggestions(repository, constraints) -> list[dict]:
    suggest_method = getattr(repository, "suggest_available_fields", None)
    if callable(suggest_method):
        return suggest_method(constraints.model_dump())
    return []


def _has_actionable_constraints(constraints) -> bool:
    return any(
        [
            constraints.area,
            constraints.group_size,
            constraints.price_band,
            constraints.price_sort,
            constraints.time_preference,
            constraints.field_type,
            constraints.amenities,
        ]
    )


def generate_chat_response(request, repository, llm_client):
    turn = prepare_chat_turn(
        request=request,
        repository=repository,
        llm_client=llm_client,
    )

    if turn["mode"] == "direct_reply":
        return {
            "answer": turn["answer"],
            "recommendations": [],
            "constraints": turn["constraints"],
        }

    if turn["mode"] == "clarification":
        llm_result = llm_client.generate_recommendation(turn["payload"])
        llm_result["constraints"] = turn["constraints"]
        llm_result["recommendations"] = []
        return llm_result

    if not turn["payload"]["candidate_fields"]:
        suggestions = _find_available_suggestions(repository, turn["constraints"])
        payload = {
            "response_mode": "no_match",
            "message": request.message,
            "constraints": turn["constraints"].model_dump(),
            "candidate_fields": [],
            "available_suggestions": suggestions,
        }
        llm_result = llm_client.generate_recommendation(payload)
        llm_result["constraints"] = turn["constraints"]
        return llm_result

    llm_result = llm_client.generate_recommendation(turn["payload"])
    llm_result["constraints"] = turn["constraints"]
    return llm_result

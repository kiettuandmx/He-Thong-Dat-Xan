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

    candidate_fields = repository.find_candidate_fields(constraints.model_dump())
    payload = build_chat_context(constraints=constraints, candidate_fields=candidate_fields)
    return {
        "mode": "recommendation",
        "constraints": constraints,
        "payload": payload,
    }


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

    llm_result = llm_client.generate_recommendation(turn["payload"])
    llm_result["constraints"] = turn["constraints"]
    return llm_result

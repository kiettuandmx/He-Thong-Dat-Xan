from app.services.context_builder import build_chat_context
from app.services.query_parser import parse_user_query


def generate_chat_response(request, repository, llm_client):
    constraints = parse_user_query(request.message)
    candidate_fields = repository.find_candidate_fields(constraints.model_dump())
    payload = build_chat_context(constraints=constraints, candidate_fields=candidate_fields)
    llm_result = llm_client.generate_recommendation(payload)
    llm_result["constraints"] = constraints
    return llm_result

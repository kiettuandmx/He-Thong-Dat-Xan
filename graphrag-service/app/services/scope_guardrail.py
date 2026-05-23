def classify_scope(message: str, llm_client) -> dict:
    if hasattr(llm_client, "classify_scope"):
        try:
            result = llm_client.classify_scope(message)
            if isinstance(result, dict) and result.get("status") in {
                "in_scope",
                "needs_clarification",
                "out_of_scope",
            }:
                return result
        except Exception:
            pass

    return {"status": "in_scope", "reply": ""}

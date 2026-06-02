from fastapi.testclient import TestClient

from app.main import app


class FakeRepository:
    def __init__(self, *_args, **_kwargs):
        pass

    def find_candidate_fields(self, _constraints):
        return [
            {
                "field_id": 1,
                "name": "San Bong Da",
                "field_type_label": "Football",
                "reasons": ["Gan khu vuc Quan 10"],
            }
        ]

    def close(self):
        return None


class FakeOpenRouterFallbackClient:
    def __init__(self, *_args, **_kwargs):
        pass

    def extract_constraints(self, _message):
        return {
            "area": "quan_7",
            "group_size": None,
            "price_band": None,
            "price_sort": None,
            "time_preference": None,
            "field_type": "football",
            "amenities": [],
        }

    def classify_scope(self, _message):
        return {"status": "in_scope", "reply": ""}

    def stream_recommendation(self, _payload):
        raise RuntimeError("OpenRouter recommendation stream failed")

    def generate_recommendation(self, payload):
        return {
            "answer": "San Bong Da la lua chon phu hop.",
            "recommendations": payload["candidate_fields"],
        }


def test_health_endpoint_returns_ok():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_returns_failure_when_openrouter_key_is_missing(monkeypatch):
    monkeypatch.setattr("app.main.settings.openrouter_api_key", "")
    monkeypatch.setattr("app.main.GraphRepository", FakeRepository)
    client = TestClient(app)

    response = client.post("/chat", json={"message": "san bong da quan 7"})

    assert response.status_code == 502
    assert "OPENROUTER_API_KEY" in response.json()["detail"]


def test_chat_stream_emits_error_event_when_openrouter_key_is_missing(monkeypatch):
    monkeypatch.setattr("app.main.settings.openrouter_api_key", "")
    monkeypatch.setattr("app.main.GraphRepository", FakeRepository)
    client = TestClient(app)

    response = client.post("/chat/stream", json={"message": "san bong da quan 7"})

    assert response.status_code == 200
    body = response.text
    assert "event: error" in body
    assert "OPENROUTER_API_KEY" in body
    assert "event: done" not in body


def test_chat_stream_falls_back_to_non_stream_recommendation_when_stream_fails(monkeypatch):
    monkeypatch.setattr("app.main.GraphRepository", FakeRepository)
    monkeypatch.setattr("app.main.OpenRouterClient", FakeOpenRouterFallbackClient)
    client = TestClient(app)

    response = client.post("/chat/stream", json={"message": "san bong da quan 7"})

    assert response.status_code == 200
    body = response.text
    assert "event: token" in body
    assert "San Bong Da la lua chon phu hop." in body
    assert "event: done" in body
    assert "event: error" not in body

from app.schemas import ChatRequest, RecommendationConstraints
from app.services.chat_service import generate_chat_response
from app.services.context_builder import build_chat_context


class FakeRepository:
    def find_candidate_fields(self, constraints):
        return [
            {
                "field_id": 201,
                "name": "San 7 Phu My A",
                "reasons": ["Gan Quan 7", "Phu hop nhom 10 nguoi", "Gia tam trung"],
            }
        ]


class FakeOpenRouterClient:
    def generate_recommendation(self, payload):
        return {
            "answer": "Toi goi y San 7 Phu My A vi gan Quan 7, hop nhom 10 nguoi va co muc gia tam trung.",
            "recommendations": payload["candidate_fields"],
        }


def test_build_chat_context_returns_candidate_fields_with_reasons():
    constraints = RecommendationConstraints(
        area="quan_7",
        group_size=10,
        price_band="medium",
        time_preference="evening",
        field_type="san_7",
        amenities=[],
    )

    result = build_chat_context(
        constraints=constraints,
        candidate_fields=[
            {
                "field_id": 201,
                "name": "San 7 Phu My A",
                "reasons": ["Gan Quan 7", "Phu hop nhom 10 nguoi", "Gia tam trung"],
            }
        ],
    )

    assert result["candidate_fields"][0]["field_id"] == 201
    assert "Gan Quan 7" in result["candidate_fields"][0]["reasons"]


def test_generate_chat_response_returns_grounded_recommendation():
    request = ChatRequest(message="Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7")

    result = generate_chat_response(
        request=request,
        repository=FakeRepository(),
        llm_client=FakeOpenRouterClient(),
    )

    assert "San 7 Phu My A" in result["answer"]
    assert result["recommendations"][0]["field_id"] == 201

from app.schemas import ChatRequest, RecommendationConstraints
from app.services.chat_service import generate_chat_response
from app.services.context_builder import build_chat_context


class FakeRepository:
    last_constraints = None

    def find_candidate_fields(self, constraints):
        self.last_constraints = constraints
        return [
            {
                "field_id": 201,
                "name": "San 7 Phu My A",
                "field_type_label": "San 7",
                "reasons": ["Gan Quan 7", "Phu hop nhom 10 nguoi", "Gia tam trung"],
            }
        ]


class FakeOpenRouterClient:
    def __init__(self, scope_result=None):
        self.scope_result = scope_result or {"status": "in_scope", "reply": ""}

    def classify_scope(self, message):
        return self.scope_result

    def generate_recommendation(self, payload):
        return {
            "answer": "Toi goi y San 7 Phu My A vi gan Quan 7, hop nhom 10 nguoi va co muc gia tam trung.",
            "recommendations": payload["candidate_fields"],
        }


class FakeConstraintAwareOpenRouterClient(FakeOpenRouterClient):
    def __init__(self, extracted_constraints=None, should_fail=False, scope_result=None):
        super().__init__(scope_result=scope_result)
        self.extracted_constraints = extracted_constraints or {}
        self.should_fail = should_fail

    def extract_constraints(self, message):
        if self.should_fail:
            raise RuntimeError("openrouter unavailable")
        return self.extracted_constraints


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


def test_generate_chat_response_uses_llm_extracted_constraints_when_available():
    request = ChatRequest(message="san bong da cho 10 nguoi gia hop ly tai quan binh thanh")
    repository = FakeRepository()

    result = generate_chat_response(
        request=request,
        repository=repository,
        llm_client=FakeConstraintAwareOpenRouterClient(
            extracted_constraints={
                "area": "binh_thanh",
                "group_size": 10,
                "price_band": "medium",
                "field_type": "football",
            }
        ),
    )

    assert repository.last_constraints["area"] == "binh_thanh"
    assert repository.last_constraints["group_size"] == 10
    assert repository.last_constraints["field_type"] == "football"
    assert result["constraints"].area == "binh_thanh"


def test_generate_chat_response_falls_back_to_rule_parser_when_llm_extraction_fails():
    request = ChatRequest(message="Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7")
    repository = FakeRepository()

    result = generate_chat_response(
        request=request,
        repository=repository,
        llm_client=FakeConstraintAwareOpenRouterClient(should_fail=True),
    )

    assert repository.last_constraints["area"] == "quan_7"
    assert repository.last_constraints["field_type"] == "san_7"
    assert result["constraints"].time_preference == "evening"


class FakeAmbiguousRepository:
    def find_candidate_fields(self, constraints):
        return [
            {
                "field_id": 1,
                "name": "San Bong Da",
                "field_type_label": "Football",
                "reasons": ["Gan khu vuc Quan 10", "Phu hop loai san Football", "Muc gia Gia vua phai"],
            },
            {
                "field_id": 3,
                "name": "San Cau Long Pro",
                "field_type_label": "Badminton",
                "reasons": ["Gan khu vuc Quan 10", "Phu hop loai san Badminton", "Muc gia Gia re"],
            },
        ]


class FailingRepository:
    last_constraints = None

    def find_candidate_fields(self, constraints):
        self.last_constraints = constraints
        return []


def test_generate_chat_response_returns_ai_scope_reply_when_needs_clarification():
    request = ChatRequest(message="san quan 10")

    result = generate_chat_response(
        request=request,
        repository=FakeAmbiguousRepository(),
        llm_client=FakeConstraintAwareOpenRouterClient(should_fail=True),
    )

    assert "San 7 Phu My A" in result["answer"]
    assert result["recommendations"][0]["field_id"] == 1


def test_generate_chat_response_passes_through_ai_clarification_reply():
    request = ChatRequest(message="san quan 10")

    result = generate_chat_response(
        request=request,
        repository=FakeAmbiguousRepository(),
        llm_client=FakeConstraintAwareOpenRouterClient(
            should_fail=True,
            scope_result={
                "status": "needs_clarification",
                "reply": "Bạn muốn sân bóng đá hay cầu lông ở Quận 10 để mình lọc chính xác hơn?",
            },
        ),
    )

    assert "Quận 10" in result["answer"]
    assert "bóng đá hay cầu lông" in result["answer"]
    assert result["recommendations"] == []


def test_generate_chat_response_returns_no_recommendations_when_repository_has_no_live_matches():
    request = ChatRequest(message="san bong da quan 7 gia vua phai")

    result = generate_chat_response(
        request=request,
        repository=FailingRepository(),
        llm_client=FakeOpenRouterClient(),
    )

    assert result["recommendations"] == []


def test_generate_chat_response_blocks_out_of_scope_weather_question():
    request = ChatRequest(message="thoi tiet hom nay the nao, co nen di da bong khong")
    repository = FakeRepository()

    result = generate_chat_response(
        request=request,
        repository=repository,
        llm_client=FakeConstraintAwareOpenRouterClient(
            should_fail=True,
            scope_result={
                "status": "out_of_scope",
                "reply": "Minh hien chi ho tro du lieu trong he thong dat san. Ban co the hoi minh ve khu vuc, mon the thao, so nguoi hoac muc gia.",
            },
        ),
    )

    assert "chi ho tro du lieu trong he thong dat san" in result["answer"]
    assert result["recommendations"] == []
    assert repository.last_constraints is None

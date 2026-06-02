from app.schemas import ChatRequest, RecommendationConstraints
from app.services.chat_service import generate_chat_response
from app.services.context_builder import build_chat_context
from app.services.text_normalizer import slugify_vietnamese


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


class TrackingRepository(FakeRepository):
    def __init__(self):
        self.last_constraints = None


class FakeOpenRouterClient:
    def __init__(self, scope_result=None):
        self.scope_result = scope_result or {"status": "in_scope", "reply": ""}
        self.last_payload = None

    def classify_scope(self, message):
        return self.scope_result

    def generate_recommendation(self, payload):
        self.last_payload = payload
        if payload.get("response_mode") == "needs_clarification":
            return {
                "answer": "Ban muon tim san mon gi, o khu vuc nao va khung gio nao de minh loc chinh xac hon?",
                "recommendations": [],
            }
        if payload.get("response_mode") == "no_match":
            suggestions = payload.get("available_suggestions", [])
            names = ", ".join(field["name"] for field in suggestions)
            constraints = payload.get("constraints", {})
            parts = ["Minh chua co du lieu khop exact"]
            if constraints.get("field_type") == "football":
                parts.append("cho san bong da")
            if constraints.get("group_size"):
                parts.append(f"cho {constraints['group_size']} nguoi")
            if constraints.get("area"):
                parts.append(f"o {constraints['area'].replace('_', ' ')}")
            answer = " ".join(parts) + "."
            if names:
                answer += f" Hien dang co: {names}."
            return {
                "answer": answer,
                "recommendations": suggestions,
            }
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


class NoMatchWithSuggestionsRepository:
    last_constraints = None

    def find_candidate_fields(self, constraints):
        self.last_constraints = constraints
        return []

    def suggest_available_fields(self, constraints):
        return [
            {
                "field_id": 1,
                "name": "San Bong Da",
                "field_type_label": "Football",
                "reasons": ["Gan khu vuc Quan 10", "Phu hop loai san Football", "Muc gia Gia vua phai"],
            },
            {
                "field_id": 10,
                "name": "San Camp Nou",
                "field_type_label": "Football",
                "reasons": ["Gan khu vuc Quan 10", "Phu hop loai san Football", "Muc gia Gia cao"],
            },
        ]


class NoMatchWithCrossSportSuggestionsRepository:
    last_constraints = None

    def find_candidate_fields(self, constraints):
        self.last_constraints = constraints
        return []

    def suggest_available_fields(self, constraints):
        if constraints.get("field_type") == "football":
            return []

        return [
            {
                "field_id": 3,
                "name": "San Cau Long Pro",
                "field_type_label": "Badminton",
                "reasons": ["Gan khu vuc Quan 10", "Phu hop loai san Badminton", "Muc gia Gia re"],
            },
            {
                "field_id": 4,
                "name": "San Pickleball Hot",
                "field_type_label": "Pickleball",
                "reasons": ["Gan khu vuc Binh Thanh", "Phu hop loai san Pickleball", "Muc gia Gia re"],
            },
        ]


def test_generate_chat_response_returns_ai_scope_reply_when_needs_clarification():
    request = ChatRequest(message="san quan 10")

    result = generate_chat_response(
        request=request,
        repository=FakeAmbiguousRepository(),
        llm_client=FakeConstraintAwareOpenRouterClient(should_fail=True),
    )

    assert "San 7 Phu My A" in result["answer"]
    assert result["recommendations"][0]["field_id"] == 1


def test_generate_chat_response_asks_ai_for_clarification_when_request_has_no_constraints():
    request = ChatRequest(message="toi muon tim san")
    repository = TrackingRepository()
    llm_client = FakeConstraintAwareOpenRouterClient(extracted_constraints={})

    result = generate_chat_response(
        request=request,
        repository=repository,
        llm_client=llm_client,
    )

    assert repository.last_constraints is None
    assert llm_client.last_payload["response_mode"] == "needs_clarification"
    assert result["recommendations"] == []
    assert "mon gi" in result["answer"]


def test_generate_chat_response_passes_through_ai_clarification_reply():
    request = ChatRequest(message="san quan 10")

    result = generate_chat_response(
        request=request,
        repository=FakeAmbiguousRepository(),
        llm_client=FakeConstraintAwareOpenRouterClient(
            should_fail=True,
            scope_result={
                "status": "needs_clarification",
                "reply": "Ban muon san bong da hay cau long o Quan 10 de minh loc chinh xac hon?",
            },
        ),
    )

    assert "Quan 10" in result["answer"]
    assert "bong da hay cau long" in result["answer"]
    assert result["recommendations"] == []


def test_generate_chat_response_returns_no_recommendations_when_repository_has_no_live_matches():
    request = ChatRequest(message="san bong da quan 7 gia vua phai")

    result = generate_chat_response(
        request=request,
        repository=FailingRepository(),
        llm_client=FakeOpenRouterClient(),
    )

    assert result["recommendations"] == []
    assert "san_bong_da" in slugify_vietnamese(result["answer"])
    assert "muc_gia" not in slugify_vietnamese(result["answer"])


def test_generate_chat_response_no_match_reply_does_not_invent_unspecified_price():
    request = ChatRequest(message="toi tim san quan 10 de choi bong da 10 nguoi")

    result = generate_chat_response(
        request=request,
        repository=FailingRepository(),
        llm_client=FakeConstraintAwareOpenRouterClient(
            extracted_constraints={
                "area": "quan_10",
                "group_size": 10,
                "field_type": "football",
            }
        ),
    )

    assert "san_bong_da" in slugify_vietnamese(result["answer"])
    assert "10_nguoi" in slugify_vietnamese(result["answer"])
    assert "quan_10" in slugify_vietnamese(result["answer"])
    assert "gia_phu_hop" not in slugify_vietnamese(result["answer"])


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


def test_generate_chat_response_no_match_returns_grounded_available_field_suggestions():
    request = ChatRequest(message="toi muon dat san bong da cho sang ngay mai, gia re, gan thu duc")
    llm_client = FakeConstraintAwareOpenRouterClient(
        extracted_constraints={
            "field_type": "football",
            "price_band": "low",
        }
    )

    result = generate_chat_response(
        request=request,
        repository=NoMatchWithSuggestionsRepository(),
        llm_client=llm_client,
    )

    assert llm_client.last_payload["response_mode"] == "no_match"
    assert llm_client.last_payload["available_suggestions"][0]["field_id"] == 1
    assert "khop exact" in result["answer"]
    assert "San Bong Da" in result["answer"]
    assert "San Camp Nou" in result["answer"]
    assert [item["field_id"] for item in result["recommendations"]] == [1, 10]


def test_generate_chat_response_roofed_request_without_data_returns_no_match_instead_of_fake_match():
    request = ChatRequest(message="toi can tim san bong da co mai che")
    llm_client = FakeConstraintAwareOpenRouterClient(
        extracted_constraints={
            "field_type": "football",
            "amenities": ["mai che"],
        }
    )

    result = generate_chat_response(
        request=request,
        repository=NoMatchWithSuggestionsRepository(),
        llm_client=llm_client,
    )

    assert llm_client.last_payload["response_mode"] == "no_match"
    assert llm_client.last_payload["constraints"]["amenities"] == ["mai_che"]
    assert "San Bong Da" in result["answer"]
    assert [item["field_id"] for item in result["recommendations"]] == [1, 10]


def test_generate_chat_response_no_match_with_explicit_football_does_not_jump_to_other_sports():
    request = ChatRequest(message="toi can san bong da o quan 10")
    llm_client = FakeConstraintAwareOpenRouterClient(
        extracted_constraints={
            "area": "quan_10",
            "field_type": "football",
        }
    )

    result = generate_chat_response(
        request=request,
        repository=NoMatchWithCrossSportSuggestionsRepository(),
        llm_client=llm_client,
    )

    assert llm_client.last_payload["response_mode"] == "no_match"
    assert llm_client.last_payload["constraints"]["field_type"] == "football"
    assert llm_client.last_payload["available_suggestions"] == []
    assert result["recommendations"] == []
    assert "San Cau Long Pro" not in result["answer"]
    assert "San Pickleball Hot" not in result["answer"]


class FootballBinhThanhRepository:
    last_constraints = None

    def find_candidate_fields(self, constraints):
        self.last_constraints = constraints
        if constraints.get("area") == "binh_thanh" and constraints.get("field_type") == "football":
            return [
                {
                    "field_id": 2,
                    "name": "San Bong Da 6A",
                    "field_type_label": "Football",
                    "reasons": ["Gan khu vuc Binh Thanh", "Phu hop loai san Football", "Muc gia Gia vua phai"],
                }
            ]
        return []


def test_generate_chat_response_returns_cheapest_available_football_in_binh_thanh():
    request = ChatRequest(message="san bong da re nhat quan binh thanh")
    repository = FootballBinhThanhRepository()

    result = generate_chat_response(
        request=request,
        repository=repository,
        llm_client=FakeConstraintAwareOpenRouterClient(should_fail=True),
    )

    assert repository.last_constraints["area"] == "binh_thanh"
    assert repository.last_constraints["field_type"] == "football"
    assert repository.last_constraints["price_sort"] == "lowest"
    assert repository.last_constraints["price_band"] is None
    assert result["recommendations"][0]["field_id"] == 2

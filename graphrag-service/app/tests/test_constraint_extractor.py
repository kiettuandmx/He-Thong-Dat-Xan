from app.schemas import RecommendationConstraints
from app.services.constraint_extractor import extract_recommendation_constraints


class FakeOpenRouterClient:
    def __init__(self, extracted_constraints=None, should_fail=False):
        self.extracted_constraints = extracted_constraints or {}
        self.should_fail = should_fail

    def extract_constraints(self, message):
        if self.should_fail:
            raise RuntimeError("llm timeout")
        return self.extracted_constraints


def test_constraint_extractor_prefers_llm_output_and_normalizes_values():
    result = extract_recommendation_constraints(
        "toi muon da toi nay 10 nguoi gia hop ly gan quan 7",
        FakeOpenRouterClient(
            extracted_constraints={
                "area": "Quận 7",
                "group_size": 10,
                "price_band": "Gia vua phai",
                "time_preference": "toi nay",
                "field_type": "bong da",
                "amenities": ["den"],
            }
        ),
    )

    assert isinstance(result, RecommendationConstraints)
    assert result.area == "quan_7"
    assert result.price_band == "medium"
    assert result.time_preference == "evening"
    assert result.field_type == "football"
    assert result.amenities == ["den"]


def test_constraint_extractor_falls_back_to_rule_parser_when_llm_fails():
    result = extract_recommendation_constraints(
        "san nao re nhat o Binh Thanh",
        FakeOpenRouterClient(should_fail=True),
    )

    assert result.area == "binh_thanh"
    assert result.price_sort == "lowest"

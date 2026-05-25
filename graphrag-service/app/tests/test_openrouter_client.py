import pytest

from app.services.openrouter_client import OpenRouterClient


def test_sanitize_answer_removes_markdown_noise_and_keeps_line_breaks():
    content = (
        "Dua tren nhu cau cua ban, toi de xuat 2 san sau:\n"
        "1. **San Bong Da** - gan Quan 10, gia vua phai.\n"
        "2. **San Camp Nou** - gia cao hon, chat luong tot hon."
    )

    result = OpenRouterClient._sanitize_answer(content)

    assert "**" not in result
    assert "San Bong Da" in result
    assert "\n" in result


def test_generate_recommendation_raises_when_api_key_is_missing():
    client = OpenRouterClient(api_key="", model="test-model")

    with pytest.raises(RuntimeError, match="OPENROUTER_API_KEY is not configured"):
        client.generate_recommendation(
            {
                "constraints": {},
                "candidate_fields": [
                    {
                        "field_id": 1,
                        "name": "San Bong Da",
                        "reasons": ["Gan khu vuc Quan 10"],
                    }
                ],
            }
        )


def test_stream_recommendation_raises_when_api_key_is_missing():
    client = OpenRouterClient(api_key="", model="test-model")

    with pytest.raises(RuntimeError, match="OPENROUTER_API_KEY is not configured"):
        list(
            client.stream_recommendation(
                {
                    "constraints": {},
                    "candidate_fields": [
                        {
                            "field_id": 1,
                            "name": "San Bong Da",
                            "reasons": ["Gan khu vuc Quan 10"],
                        }
                    ],
                }
            )
        )


def test_build_prompt_includes_no_match_mode_and_available_suggestions():
    prompt = OpenRouterClient._build_prompt(
        {
            "response_mode": "no_match",
            "constraints": {"field_type": "football", "area": "binh_thanh"},
            "candidate_fields": [],
            "available_suggestions": [
                {"field_id": 2, "name": "San Bong Da 6A", "reasons": ["Gan khu vuc Binh Thanh"]},
            ],
        }
    )

    assert "Response mode: no_match" in prompt
    assert "Available suggestions" in prompt
    assert "San Bong Da 6A" in prompt

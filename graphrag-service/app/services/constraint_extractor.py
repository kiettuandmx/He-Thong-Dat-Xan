from app.schemas import RecommendationConstraints
from app.services.query_parser import KNOWN_AREAS, parse_user_query
from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_price_band,
    normalize_price_sort,
    normalize_sport_type,
    normalize_time_preference,
)
from app.services.text_normalizer import slugify_vietnamese


def extract_recommendation_constraints(message: str, llm_client) -> RecommendationConstraints:
    fallback = parse_user_query(message)

    if not hasattr(llm_client, "extract_constraints"):
        return fallback

    try:
        raw_constraints = llm_client.extract_constraints(message)
    except Exception:
        return fallback

    if not isinstance(raw_constraints, dict):
        return fallback

    normalized = _normalize_constraints(raw_constraints, fallback)
    return RecommendationConstraints(**normalized)


def _normalize_constraints(raw_constraints: dict, fallback: RecommendationConstraints) -> dict:
    group_size = _normalize_group_size(raw_constraints.get("group_size"), fallback.group_size)
    return {
        "area": _normalize_area(raw_constraints.get("area")) or fallback.area,
        "group_size": group_size,
        "price_band": normalize_price_band(_as_text(raw_constraints.get("price_band"))) or fallback.price_band,
        "price_sort": normalize_price_sort(_as_text(raw_constraints.get("price_sort"))) or fallback.price_sort,
        "time_preference": normalize_time_preference(_as_text(raw_constraints.get("time_preference")))
        or fallback.time_preference,
        "field_type": normalize_sport_type(_as_text(raw_constraints.get("field_type")))
        or infer_field_type_from_group_size(group_size)
        or fallback.field_type,
        "amenities": _normalize_amenities(raw_constraints.get("amenities")),
    }


def _normalize_area(value: object) -> str | None:
    text = _as_text(value)
    if not text:
        return None

    lowered = text.lower()
    slug_text = slugify_vietnamese(text)
    for area_slug, variants in KNOWN_AREAS.items():
        if any(variant in lowered for variant in variants) or area_slug in slug_text:
            return area_slug

    return None


def _normalize_group_size(value: object, fallback: int | None) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())
    return fallback


def _normalize_amenities(value: object) -> list[str]:
    if isinstance(value, list):
        return [item.strip().lower() for item in value if isinstance(item, str) and item.strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip().lower()]
    return []


def _as_text(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return str(value)

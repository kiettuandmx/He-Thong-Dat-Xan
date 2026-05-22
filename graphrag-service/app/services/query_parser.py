import re

from app.schemas import RecommendationConstraints
from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_price_band,
    normalize_price_sort,
    normalize_sport_type,
    normalize_time_preference,
)
from app.services.text_normalizer import slugify_vietnamese


KNOWN_AREAS = {
    "quan_7": ["quan 7", "quận 7"],
    "binh_thanh": ["binh thanh", "bình thạnh"],
    "quan_10": ["quan 10", "quận 10"],
}


def parse_user_query(text: str) -> RecommendationConstraints:
    lowered = text.lower()
    people_match = re.search(r"(\d+)\s*nguoi", lowered)
    group_size = int(people_match.group(1)) if people_match else None

    area = None
    slug_text = slugify_vietnamese(text)
    for area_slug, variants in KNOWN_AREAS.items():
      if any(variant in lowered for variant in variants) or area_slug in slug_text:
        area = area_slug
        break

    price_band = normalize_price_band(lowered)
    price_sort = normalize_price_sort(lowered)
    time_preference = normalize_time_preference(lowered)
    field_type = normalize_sport_type(lowered) or infer_field_type_from_group_size(group_size)

    return RecommendationConstraints(
        area=area,
        group_size=group_size,
        price_band=price_band,
        price_sort=price_sort,
        time_preference=time_preference,
        field_type=field_type,
        amenities=[],
    )

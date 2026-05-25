import re

from app.schemas import RecommendationConstraints
from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_amenities,
    normalize_price_band,
    normalize_price_sort,
    normalize_sport_type,
    normalize_time_preference,
)
from app.services.text_normalizer import slugify_vietnamese


KNOWN_AREAS = {
    "quan_7": ["quan 7"],
    "binh_thanh": ["binh thanh"],
    "quan_10": ["quan 10"],
}


def parse_user_query(text: str) -> RecommendationConstraints:
    normalized_text = slugify_vietnamese(text).replace("_", " ")
    slug_text = slugify_vietnamese(text)
    people_match = re.search(r"(\d+)\s*nguoi", normalized_text)
    group_size = int(people_match.group(1)) if people_match else None

    area = None
    for area_slug, variants in KNOWN_AREAS.items():
        if any(slugify_vietnamese(variant).replace("_", " ") in normalized_text for variant in variants):
            area = area_slug
            break
        if area_slug in slug_text:
            area = area_slug
            break

    price_band = normalize_price_band(normalized_text)
    price_sort = normalize_price_sort(normalized_text)
    time_preference = normalize_time_preference(normalized_text)
    field_type = normalize_sport_type(normalized_text) or infer_field_type_from_group_size(group_size)
    amenities = normalize_amenities(normalized_text)

    return RecommendationConstraints(
        area=area,
        group_size=group_size,
        price_band=price_band,
        price_sort=price_sort,
        time_preference=time_preference,
        field_type=field_type,
        amenities=amenities,
    )

import re

from app.schemas import RecommendationConstraints
from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_price_band,
    normalize_time_preference,
)


def parse_user_query(text: str) -> RecommendationConstraints:
    lowered = text.lower()
    people_match = re.search(r"(\d+)\s*nguoi", lowered)
    group_size = int(people_match.group(1)) if people_match else None

    area = None
    if "quan 7" in lowered:
        area = "quan_7"

    price_band = normalize_price_band(lowered)
    time_preference = normalize_time_preference(lowered)
    field_type = infer_field_type_from_group_size(group_size)

    return RecommendationConstraints(
        area=area,
        group_size=group_size,
        price_band=price_band,
        time_preference=time_preference,
        field_type=field_type,
        amenities=[],
    )

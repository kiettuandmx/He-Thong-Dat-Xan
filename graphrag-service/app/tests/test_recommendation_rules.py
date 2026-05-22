from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_price_band,
    normalize_time_preference,
)


def test_infer_field_type_from_group_size_prefers_seven_a_side():
    assert infer_field_type_from_group_size(10) == "san_7"


def test_normalize_price_band_maps_vua_phai_to_medium():
    assert normalize_price_band("gia vua phai") == "medium"


def test_normalize_time_preference_maps_toi_nay_to_evening():
    assert normalize_time_preference("toi nay") == "evening"


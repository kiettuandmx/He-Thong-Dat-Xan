from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_price_band,
    normalize_price_sort,
    normalize_sport_type,
    normalize_time_preference,
)


def test_infer_field_type_from_group_size_prefers_seven_a_side():
    assert infer_field_type_from_group_size(10) == "san_7"


def test_normalize_price_band_maps_vua_phai_to_medium():
    assert normalize_price_band("gia vua phai") == "medium"


def test_normalize_price_band_maps_hop_ly_to_medium():
    assert normalize_price_band("gia hop ly") == "medium"


def test_normalize_time_preference_maps_toi_nay_to_evening():
    assert normalize_time_preference("toi nay") == "evening"


def test_normalize_price_sort_maps_re_nhat_to_lowest():
    assert normalize_price_sort("san re nhat o binh thanh") == "lowest"


def test_normalize_sport_type_maps_bong_da_to_football():
    assert normalize_sport_type("san bong da o binh thanh") == "football"

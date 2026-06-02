from app.services.query_parser import parse_user_query


def test_parse_user_query_extracts_area_people_budget_and_time():
    result = parse_user_query("Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7")

    assert result.area == "quan_7"
    assert result.group_size == 10
    assert result.price_band == "medium"
    assert result.time_preference == "evening"
    assert result.field_type == "san_7"


def test_parse_user_query_extracts_binh_thanh_and_lowest_price():
    result = parse_user_query("san nao re nhat o Binh Thanh")

    assert result.area == "binh_thanh"
    assert result.price_sort == "lowest"
    assert result.price_band is None


def test_parse_user_query_does_not_treat_toi_pronoun_as_evening():
    result = parse_user_query("toi muon tim san")

    assert result.time_preference is None


def test_parse_user_query_understands_accents_slang_and_night_time():
    result = parse_user_query(
        "toi tim san b\u00f3ng \u0111\u00e1 \u1edf qu\u1eadn 10 "
        "\u0111\u1ec3 \u0111\u00e1 banh \u0111\u00eam cho 10 ng\u01b0\u1eddi"
    )

    assert result.area == "quan_10"
    assert result.group_size == 10
    assert result.time_preference == "evening"
    assert result.field_type == "football"


def test_parse_user_query_extracts_roofed_amenity():
    result = parse_user_query("toi can tim san bong da co mai che")

    assert result.field_type == "football"
    assert result.amenities == ["mai_che"]

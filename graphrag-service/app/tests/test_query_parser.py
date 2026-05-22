from app.services.query_parser import parse_user_query


def test_parse_user_query_extracts_area_people_budget_and_time():
    result = parse_user_query("Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7")

    assert result.area == "quan_7"
    assert result.group_size == 10
    assert result.price_band == "medium"
    assert result.time_preference == "evening"
    assert result.field_type == "san_7"

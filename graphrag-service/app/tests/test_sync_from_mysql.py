import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[3] / "database" / "graphrag" / "sync_from_mysql.py"
SPEC = importlib.util.spec_from_file_location("sync_from_mysql", MODULE_PATH)
sync_from_mysql = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(sync_from_mysql)


def test_build_field_payload_uses_district_when_present():
    payload = sync_from_mysql.build_field_payload(
        {
            "id": 2,
            "name": "Sân Bóng Đá 6A",
            "type": "Football",
            "price_per_hour": 400000,
            "stadium_id": 2,
            "stadium_name": "Bình Thạnh",
            "district": "Bình Thạnh",
            "address": "Bạch Đằng",
            "city": "TP.HCM",
            "image_url": "image.jpg",
            "average_rating": 0,
            "review_count": 0,
        }
    )

    assert payload["area_slug"] == "binh_thanh"
    assert payload["field_type_slug"] == "football"
    assert payload["price_band_slug"] == "medium"
    assert payload["address"] == "Bạch Đằng"


def test_build_field_payload_falls_back_to_stadium_name_when_district_is_missing():
    payload = sync_from_mysql.build_field_payload(
        {
            "id": 8,
            "name": "Lâm Viên",
            "type": "Football",
            "price_per_hour": 499000,
            "stadium_id": 3,
            "stadium_name": "Thủ Đức",
            "district": None,
            "address": "99 Linh Trung",
            "city": None,
            "image_url": None,
            "average_rating": 0,
            "review_count": 0,
        }
    )

    assert payload["area_slug"] == "thu_duc"
    assert payload["area_name"] == "Thủ Đức"
    assert payload["price_band_slug"] == "medium"
    assert payload["field_type_label"] == "Football"


def test_find_stale_field_ids_returns_graph_ids_missing_from_mysql():
    stale_ids = sync_from_mysql.find_stale_field_ids(
        existing_field_ids=[1, 2, 3, 201],
        active_field_ids=[1, 2, 3, 21],
    )

    assert stale_ids == [201]

from app.services.text_normalizer import slugify_vietnamese


def _normalize_lookup(text: str | None) -> str | None:
    if not text:
        return None
    return slugify_vietnamese(text).replace("_", " ")


def infer_field_type_from_group_size(group_size: int | None) -> str | None:
    if group_size is None:
        return None
    if group_size <= 6:
        return "san_5"
    if group_size <= 14:
        return "san_7"
    return "san_11"


def normalize_price_band(text: str | None) -> str | None:
    lowered = _normalize_lookup(text)
    if not lowered:
        return None

    if "re nhat" in lowered or "thap nhat" in lowered or "dat nhat" in lowered or "cao nhat" in lowered:
        return None
    if "re" in lowered:
        return "low"
    if "vua phai" in lowered or "tam trung" in lowered or "hop ly" in lowered:
        return "medium"
    if "cao" in lowered or "xinh" in lowered:
        return "high"
    return None


def normalize_price_sort(text: str | None) -> str | None:
    lowered = _normalize_lookup(text)
    if not lowered:
        return None

    if "re nhat" in lowered or "thap nhat" in lowered:
        return "lowest"
    if "dat nhat" in lowered or "cao nhat" in lowered:
        return "highest"
    return None


def normalize_time_preference(text: str | None) -> str | None:
    lowered = _normalize_lookup(text)
    if not lowered:
        return None

    if "toi" in lowered or "dem" in lowered or "buoi dem" in lowered or "sau gio lam" in lowered:
        return "evening"
    if "sang" in lowered:
        return "morning"
    if "chieu" in lowered:
        return "afternoon"
    return None


def normalize_sport_type(text: str | None) -> str | None:
    lowered = _normalize_lookup(text)
    if not lowered:
        return None

    if "bong da" in lowered or "da banh" in lowered or "football" in lowered:
        return "football"
    if "cau long" in lowered or "badminton" in lowered:
        return "badminton"
    if "pickleball" in lowered:
        return "pickleball"
    return None


def normalize_amenities(value: object) -> list[str]:
    if isinstance(value, list):
        raw_values = [item for item in value if isinstance(item, str) and item.strip()]
    elif isinstance(value, str) and value.strip():
        raw_values = [value]
    else:
        return []

    normalized: list[str] = []
    for raw_value in raw_values:
        lowered = _normalize_lookup(raw_value)
        if not lowered:
            continue

        if "mai che" in lowered or "co mai che" in lowered:
            normalized.append("mai_che")
        elif "den" in lowered or "co den" in lowered:
            normalized.append("den")

    return list(dict.fromkeys(normalized))

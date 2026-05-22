def infer_field_type_from_group_size(group_size: int | None) -> str | None:
    if group_size is None:
        return None
    if group_size <= 6:
        return "san_5"
    if group_size <= 14:
        return "san_7"
    return "san_11"


def normalize_price_band(text: str | None) -> str | None:
    if not text:
        return None

    lowered = text.lower()
    if "re" in lowered:
        return "low"
    if "vua phai" in lowered or "tam trung" in lowered:
        return "medium"
    if "cao" in lowered or "xinh" in lowered:
        return "high"
    return None


def normalize_time_preference(text: str | None) -> str | None:
    if not text:
        return None

    lowered = text.lower()
    if "toi" in lowered or "sau gio lam" in lowered:
        return "evening"
    if "sang" in lowered:
        return "morning"
    if "chieu" in lowered:
        return "afternoon"
    return None


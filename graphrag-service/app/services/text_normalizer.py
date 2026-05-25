import unicodedata


def slugify_vietnamese(text: str) -> str:
    # Preserve Vietnamese d-stroke before ASCII folding.
    safe_text = text.replace("\u0111", "d").replace("\u0110", "D")
    normalized = unicodedata.normalize("NFKD", safe_text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return "_".join(ascii_text.lower().split())

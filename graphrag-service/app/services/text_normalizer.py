import unicodedata


def slugify_vietnamese(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return "_".join(ascii_text.lower().split())

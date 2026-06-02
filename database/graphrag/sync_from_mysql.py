import json
import locale
import os
import subprocess
import sys
import unicodedata
from pathlib import Path

from neo4j import GraphDatabase
from pydantic_settings import BaseSettings, SettingsConfigDict

try:
    import mysql.connector
except ImportError:  # pragma: no cover - runtime fallback
    mysql = None
else:  # pragma: no cover - runtime fallback
    mysql = mysql.connector


MYSQL_QUERY = """
SELECT
  f.id,
  f.name,
  f.type,
  f.price_per_hour,
  f.status,
  s.id AS stadium_id,
  s.name AS stadium_name,
  l.address,
  l.district,
  l.city,
  (
    SELECT fi.image_url
    FROM FieldImages fi
    WHERE fi.field_id = f.id
    ORDER BY fi.id ASC
    LIMIT 1
  ) AS image_url,
  COALESCE(
    (
      SELECT ROUND(AVG(r.rating), 2)
      FROM reviews r
      WHERE r.field_id = f.id
    ),
    0
  ) AS average_rating,
  (
    SELECT COUNT(*)
    FROM reviews r2
    WHERE r2.field_id = f.id
  ) AS review_count
FROM fields f
JOIN stadiums s ON s.id = f.stadium_id
LEFT JOIN locations l ON l.id = s.location_id
WHERE f.status = 'active'
ORDER BY f.id ASC
"""


class Settings(BaseSettings):
    neo4j_uri: str = "bolt://127.0.0.1:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_database: str = ""
    mysql_user: str = ""
    mysql_password: str = ""
    mysql_cli_path: str | None = None

    model_config = SettingsConfigDict(
        env_file="graphrag-service/.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


def normalize_local_neo4j_uri(uri: str) -> str:
    if uri.startswith("neo4j://127.0.0.1") or uri.startswith("neo4j://localhost"):
        return uri.replace("neo4j://", "bolt://", 1)
    return uri


def slugify_vietnamese(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    normalized = normalized.replace("đ", "d").replace("Đ", "D")
    ascii_text = "".join(character for character in normalized if unicodedata.category(character) != "Mn")
    collapsed = "".join(character if character.isalnum() else "_" for character in ascii_text.lower())
    return "_".join(part for part in collapsed.split("_") if part)


def normalize_field_type(field_type: str | None) -> tuple[str, str]:
    value = (field_type or "").strip().lower()
    if value in {"football", "bong_da", "bong da"}:
        return "football", "Football"
    if value in {"badminton", "cau_long", "cau long"}:
        return "badminton", "Badminton"
    if value in {"pickleball"}:
        return "pickleball", "Pickleball"
    return slugify_vietnamese(field_type or "other"), (field_type or "Other").strip() or "Other"


def infer_price_band(price_per_hour: float) -> tuple[str, str]:
    if price_per_hour <= 200000:
        return "low", "Gia re"
    if price_per_hour <= 700000:
        return "medium", "Gia vua phai"
    return "high", "Gia cao"


def build_field_payload(row: dict) -> dict:
    area_name = (row.get("district") or row.get("stadium_name") or "Khac").strip()
    area_slug = slugify_vietnamese(area_name) or "khac"
    field_type_slug, field_type_label = normalize_field_type(row.get("type"))
    price_per_hour = float(row.get("price_per_hour") or 0)
    price_band_slug, price_band_label = infer_price_band(price_per_hour)
    average_rating = float(row.get("average_rating") or 0)
    review_count = int(row.get("review_count") or 0)

    return {
        "field_id": int(row["id"]),
        "name": (row.get("name") or "").strip(),
        "stadium_id": int(row["stadium_id"]),
        "stadium_name": (row.get("stadium_name") or "").strip(),
        "area_slug": area_slug,
        "area_name": area_name,
        "address": (row.get("address") or "").strip() or None,
        "city": (row.get("city") or "").strip() or None,
        "image_url": (row.get("image_url") or "").strip() or None,
        "average_rating": average_rating,
        "review_count": review_count,
        "field_type_slug": field_type_slug,
        "field_type_label": field_type_label,
        "price_per_hour": price_per_hour,
        "price_band_slug": price_band_slug,
        "price_band_label": price_band_label,
    }


def fetch_fields_via_connector(settings: Settings) -> list[dict]:
    if mysql is None:
        raise RuntimeError("mysql connector is not installed")

    connection = mysql.connect(
        host=settings.mysql_host,
        port=settings.mysql_port,
        database=settings.mysql_database,
        user=settings.mysql_user,
        password=settings.mysql_password,
    )
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(MYSQL_QUERY)
        return cursor.fetchall()
    finally:
        connection.close()


def resolve_mysql_cli_path(settings: Settings) -> str:
    candidates = [
        settings.mysql_cli_path,
        r"C:\laragon6.0\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe",
        r"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    raise RuntimeError("mysql.exe not found for CLI fallback")


def fetch_fields_via_cli(settings: Settings) -> list[dict]:
    mysql_cli_path = resolve_mysql_cli_path(settings)
    json_query = (
        "SELECT JSON_OBJECT("
        "'id', f.id,"
        "'name', f.name,"
        "'type', f.type,"
        "'price_per_hour', f.price_per_hour,"
        "'status', f.status,"
        "'stadium_id', s.id,"
        "'stadium_name', s.name,"
        "'address', l.address,"
        "'district', l.district,"
        "'city', l.city,"
        "'image_url', (SELECT fi.image_url FROM FieldImages fi WHERE fi.field_id = f.id ORDER BY fi.id ASC LIMIT 1),"
        "'average_rating', COALESCE((SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.field_id = f.id), 0),"
        "'review_count', (SELECT COUNT(*) FROM reviews r2 WHERE r2.field_id = f.id)"
        ") "
        "FROM fields f "
        "JOIN stadiums s ON s.id = f.stadium_id "
        "LEFT JOIN locations l ON l.id = s.location_id "
        "WHERE f.status = 'active' "
        "ORDER BY f.id ASC"
    )

    command = [
        mysql_cli_path,
        "-u",
        settings.mysql_user,
        "-D",
        settings.mysql_database,
        "--default-character-set=utf8mb4",
        "--batch",
        "--raw",
        "--skip-column-names",
        "-e",
        json_query,
    ]
    if settings.mysql_host:
        command.extend(["-h", settings.mysql_host])
    if settings.mysql_port:
        command.extend(["-P", str(settings.mysql_port)])
    if settings.mysql_password:
        command.insert(4, f"-p{settings.mysql_password}")

    completed = subprocess.run(
        command,
        check=True,
        capture_output=True,
    )
    output = decode_mysql_output(completed.stdout)
    rows = []
    for line in output.splitlines():
        stripped = line.strip()
        if stripped:
            rows.append(json.loads(stripped))
    return rows


def decode_mysql_output(raw_output: bytes) -> str:
    candidates = [
        "utf-8",
        locale.getpreferredencoding(False),
        "cp1258",
        "cp850",
        "latin-1",
    ]
    for encoding in candidates:
        try:
            return raw_output.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw_output.decode("utf-8", errors="replace")


def fetch_fields(settings: Settings) -> list[dict]:
    try:
        return fetch_fields_via_connector(settings)
    except Exception:
        return fetch_fields_via_cli(settings)


def load_existing_field_ids(session) -> list[int]:
    records = session.run("MATCH (f:Field) RETURN f.field_id AS field_id ORDER BY field_id")
    return [int(record["field_id"]) for record in records if record.get("field_id") is not None]


def find_stale_field_ids(existing_field_ids: list[int], active_field_ids: list[int]) -> list[int]:
    active_id_set = set(active_field_ids)
    return sorted(field_id for field_id in existing_field_ids if field_id not in active_id_set)


def delete_stale_fields(tx, stale_field_ids: list[int]) -> None:
    if not stale_field_ids:
        return
    tx.run(
        """
        MATCH (f:Field)
        WHERE f.field_id IN $stale_field_ids
        DETACH DELETE f
        """,
        stale_field_ids=stale_field_ids,
    )


def upsert_field(tx, row: dict) -> None:
    tx.run(
        """
        MERGE (a:Area {slug: $area_slug})
        SET a.name = $area_name
        MERGE (s:Stadium {stadium_id: $stadium_id})
        SET s.name = $stadium_name
        MERGE (ft:FieldType {slug: $field_type_slug})
        SET ft.label = $field_type_label
        MERGE (pb:PriceBand {slug: $price_band_slug})
        SET pb.label = $price_band_label
        MERGE (f:Field {field_id: $field_id})
        SET f.name = $field_name,
            f.price_per_hour = $price_per_hour,
            f.address = $address,
            f.city = $city,
            f.image_url = $image_url,
            f.average_rating = $average_rating,
            f.review_count = $review_count
        MERGE (f)-[:LOCATED_IN]->(a)
        MERGE (f)-[:BELONGS_TO]->(s)
        MERGE (f)-[:HAS_TYPE]->(ft)
        MERGE (f)-[:FITS_PRICE_BAND]->(pb)
        """,
        area_slug=row["area_slug"],
        area_name=row["area_name"],
        stadium_id=row["stadium_id"],
        stadium_name=row["stadium_name"],
        field_type_slug=row["field_type_slug"],
        field_type_label=row["field_type_label"],
        price_band_slug=row["price_band_slug"],
        price_band_label=row["price_band_label"],
        field_id=row["field_id"],
        field_name=row["name"],
        price_per_hour=row["price_per_hour"],
        address=row["address"],
        city=row["city"],
        image_url=row["image_url"],
        average_rating=row["average_rating"],
        review_count=row["review_count"],
    )


def main() -> None:
    settings = Settings()
    rows = fetch_fields(settings)
    payloads = [build_field_payload(row) for row in rows]
    active_field_ids = [payload["field_id"] for payload in payloads]

    driver = GraphDatabase.driver(
        normalize_local_neo4j_uri(settings.neo4j_uri),
        auth=(settings.neo4j_username, settings.neo4j_password),
    )
    try:
        with driver.session() as session:
            existing_field_ids = load_existing_field_ids(session)
            stale_field_ids = find_stale_field_ids(existing_field_ids, active_field_ids)
            session.execute_write(delete_stale_fields, stale_field_ids)
            for payload in payloads:
                session.execute_write(upsert_field, payload)
        print(
            json.dumps(
                {"synced_fields": len(payloads), "deleted_stale_fields": len(stale_field_ids)},
                ensure_ascii=False,
            )
        )
    finally:
        driver.close()


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:  # pragma: no cover - runtime safeguard
        print(f"Sync execution error: {exc.stderr or exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    except Exception as exc:  # pragma: no cover - runtime safeguard
        print(f"Sync execution error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

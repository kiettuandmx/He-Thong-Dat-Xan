import json
from pathlib import Path

from neo4j import GraphDatabase
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    neo4j_uri: str = "bolt://127.0.0.1:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""

    model_config = SettingsConfigDict(
        env_file="graphrag-service/.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


def load_rows() -> list[dict]:
    path = Path(__file__).with_name("real_sample_fields.json")
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def normalize_local_neo4j_uri(uri: str) -> str:
    if uri.startswith("neo4j://127.0.0.1") or uri.startswith("neo4j://localhost"):
        return uri.replace("neo4j://", "bolt://", 1)

    return uri


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
            f.price_per_hour = $price_per_hour
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
    )


def main() -> None:
    settings = Settings()
    rows = load_rows()
    driver = GraphDatabase.driver(
        normalize_local_neo4j_uri(settings.neo4j_uri),
        auth=(settings.neo4j_username, settings.neo4j_password),
    )
    try:
        with driver.session() as session:
            for row in rows:
                session.execute_write(upsert_field, row)
        print(json.dumps({"loaded_fields": len(rows)}, ensure_ascii=False))
    finally:
        driver.close()


if __name__ == "__main__":
    main()

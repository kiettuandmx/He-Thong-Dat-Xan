import json
from pathlib import Path

from neo4j import GraphDatabase


class GraphRepository:
    def __init__(self, uri: str, username: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(username, password))
        self._dev_candidates = self._load_dev_candidates()

    def close(self) -> None:
        self.driver.close()

    def find_candidate_fields(self, constraints: dict) -> list[dict]:
        area = constraints.get("area")
        field_type = constraints.get("field_type")
        price_band = constraints.get("price_band")
        price_sort = constraints.get("price_sort")
        time_preference = constraints.get("time_preference")

        query = """
        MATCH (f:Field)-[:LOCATED_IN]->(a:Area)
        OPTIONAL MATCH (f)-[:HAS_TYPE]->(ft:FieldType)
        OPTIONAL MATCH (f)-[:FITS_PRICE_BAND]->(pb:PriceBand)
        OPTIONAL MATCH (f)-[:MATCHES_TIME_PREFERENCE]->(tp:TimePreference)
        WITH f, a, ft, pb, tp
        WHERE ($area IS NULL OR a.slug = $area)
          AND ($field_type IS NULL OR ft.slug = $field_type)
          AND ($price_band IS NULL OR pb.slug = $price_band)
          AND ($time_preference IS NULL OR tp.slug = $time_preference)
        RETURN
          f.field_id AS field_id,
          f.name AS name,
          a.name AS area_name,
          f.price_per_hour AS price_per_hour,
          ft.label AS field_type_label,
          pb.label AS price_band_label,
          tp.label AS time_label
        ORDER BY
          CASE WHEN $price_sort = 'lowest' THEN coalesce(f.price_per_hour, 0) END ASC,
          CASE WHEN $price_sort = 'highest' THEN coalesce(f.price_per_hour, 0) END DESC,
          f.field_id ASC
        LIMIT 3
        """

        try:
            with self.driver.session() as session:
                records = session.run(
                    query,
                    area=area,
                    field_type=field_type,
                    price_band=price_band,
                    price_sort=price_sort,
                    time_preference=time_preference,
                )
                return [self._record_to_candidate(record) for record in records]
        except Exception:
            return self._match_dev_candidates(constraints)

    @staticmethod
    def _record_to_candidate(record) -> dict:
        reasons = []
        if record.get("area_name"):
            reasons.append(f"Gan khu vuc {record['area_name']}")
        if record.get("field_type_label"):
            reasons.append(f"Phu hop loai san {record['field_type_label']}")
        if record.get("price_band_label"):
            reasons.append(f"Muc gia {record['price_band_label']}")
        elif record.get("price_per_hour") is not None:
            reasons.append(f"Gia {int(float(record['price_per_hour'])):,} VND".replace(",", "."))
        if record.get("time_label"):
            reasons.append(f"Phu hop khung gio {record['time_label']}")

        return {
            "field_id": record["field_id"],
            "name": record["name"],
            "reasons": reasons,
        }

    def _load_dev_candidates(self) -> list[dict]:
        project_root = Path(__file__).resolve().parents[3]
        candidates_path = project_root / "database" / "graphrag" / "dev_candidates.json"
        if not candidates_path.exists():
            return []

        with candidates_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    def _match_dev_candidates(self, constraints: dict) -> list[dict]:
        matches = []
        for candidate in self._dev_candidates:
            if constraints.get("area") and candidate.get("area") != constraints["area"]:
                continue
            if constraints.get("field_type") and candidate.get("field_type") != constraints["field_type"]:
                continue
            if constraints.get("price_band") and candidate.get("price_band") != constraints["price_band"]:
                continue
            if constraints.get("time_preference") and candidate.get("time_preference") != constraints["time_preference"]:
                continue

            matches.append(
                {
                    "field_id": candidate["field_id"],
                    "name": candidate["name"],
                    "reasons": [
                        f"Gan khu vuc {candidate['area_name']}",
                        f"Phu hop loai san {candidate['field_type_label']}",
                        f"Muc gia {candidate['price_band_label']}",
                        f"Phu hop khung gio {candidate['time_label']}",
                    ],
                }
            )
        if constraints.get("price_sort") == "lowest":
            matches.sort(key=lambda item: next((reason for reason in item["reasons"] if reason.startswith("Gia ")), ""))

        return matches[:3]

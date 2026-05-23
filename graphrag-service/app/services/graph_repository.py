from neo4j import GraphDatabase


class GraphRepository:
    def __init__(self, uri: str, username: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(username, password))

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
            "field_type_label": record.get("field_type_label"),
            "reasons": reasons,
        }

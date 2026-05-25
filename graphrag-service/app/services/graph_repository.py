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
        amenities = constraints.get("amenities") or []

        query = """
        MATCH (f:Field)-[:LOCATED_IN]->(a:Area)
        OPTIONAL MATCH (f)-[:HAS_TYPE]->(ft:FieldType)
        OPTIONAL MATCH (f)-[:FITS_PRICE_BAND]->(pb:PriceBand)
        OPTIONAL MATCH (f)-[:MATCHES_TIME_PREFERENCE]->(tp:TimePreference)
        OPTIONAL MATCH (f)-[:HAS_AMENITY]->(am:Amenity)
        WITH f, a, ft, pb, tp, collect(DISTINCT am.slug) AS amenity_slugs
        WHERE ($area IS NULL OR a.slug = $area)
          AND ($field_type IS NULL OR ft.slug = $field_type)
          AND ($price_band IS NULL OR pb.slug = $price_band)
          AND ($time_preference IS NULL OR tp.slug = $time_preference)
          AND (size($amenities) = 0 OR ALL(amenity IN $amenities WHERE amenity IN amenity_slugs))
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
                amenities=amenities,
            )
            return [self._record_to_candidate(record) for record in records]

    def suggest_available_fields(self, constraints: dict) -> list[dict]:
        exact_field_type = constraints.get("field_type")
        exact_area = constraints.get("area")

        if exact_field_type:
            same_type = self._run_suggestion_query(
                constraints=constraints,
                exact_field_type=exact_field_type,
                exact_area=None,
            )
            if same_type:
                return same_type

        if exact_area:
            same_area = self._run_suggestion_query(
                constraints=constraints,
                exact_field_type=None,
                exact_area=exact_area,
            )
            if same_area:
                return same_area

        return self._run_suggestion_query(
            constraints=constraints,
            exact_field_type=None,
            exact_area=None,
        )

    def _run_suggestion_query(
        self,
        constraints: dict,
        exact_field_type: str | None,
        exact_area: str | None,
    ) -> list[dict]:
        query = """
        MATCH (f:Field)-[:LOCATED_IN]->(a:Area)
        OPTIONAL MATCH (f)-[:HAS_TYPE]->(ft:FieldType)
        OPTIONAL MATCH (f)-[:FITS_PRICE_BAND]->(pb:PriceBand)
        OPTIONAL MATCH (f)-[:MATCHES_TIME_PREFERENCE]->(tp:TimePreference)
        WITH
          f,
          a,
          ft,
          pb,
          tp,
          CASE WHEN $requested_field_type IS NOT NULL AND ft.slug = $requested_field_type THEN 3 ELSE 0 END +
          CASE WHEN $requested_area IS NOT NULL AND a.slug = $requested_area THEN 2 ELSE 0 END +
          CASE WHEN $requested_price_band IS NOT NULL AND pb.slug = $requested_price_band THEN 1 ELSE 0 END +
          CASE WHEN $requested_time_preference IS NOT NULL AND tp.slug = $requested_time_preference THEN 1 ELSE 0 END
          AS score
        WHERE ($exact_field_type IS NULL OR ft.slug = $exact_field_type)
          AND ($exact_area IS NULL OR a.slug = $exact_area)
        RETURN
          f.field_id AS field_id,
          f.name AS name,
          a.name AS area_name,
          f.price_per_hour AS price_per_hour,
          ft.label AS field_type_label,
          pb.label AS price_band_label,
          tp.label AS time_label,
          score AS score
        ORDER BY
          score DESC,
          CASE WHEN $price_sort = 'lowest' THEN coalesce(f.price_per_hour, 0) END ASC,
          CASE WHEN $price_sort = 'highest' THEN coalesce(f.price_per_hour, 0) END DESC,
          f.field_id ASC
        LIMIT 3
        """

        with self.driver.session() as session:
            records = session.run(
                query,
                exact_field_type=exact_field_type,
                exact_area=exact_area,
                requested_field_type=constraints.get("field_type"),
                requested_area=constraints.get("area"),
                requested_price_band=constraints.get("price_band"),
                requested_time_preference=constraints.get("time_preference"),
                price_sort=constraints.get("price_sort"),
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

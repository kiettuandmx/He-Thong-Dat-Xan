import json
import os
import sys

from neo4j import GraphDatabase

try:
    import mysql.connector
except ImportError as exc:  # pragma: no cover - runtime safeguard
    raise SystemExit(
        "mysql-connector-python is required to run database/graphrag/sync_from_mysql.py"
    ) from exc


def fetch_fields(mysql_conn):
    query = """
    SELECT f.id, f.name, f.type, f.price_per_hour,
           s.id AS stadium_id, s.name AS stadium_name,
           l.district
    FROM fields f
    JOIN stadiums s ON s.id = f.stadium_id
    LEFT JOIN locations l ON l.id = s.location_id
    WHERE f.status = 'active'
    LIMIT 20
    """
    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute(query)
    return cursor.fetchall()


def upsert_field(tx, row):
    district = row.get("district") or "unknown"
    tx.run(
        """
        MERGE (a:Area {slug: $area_slug})
        ON CREATE SET a.name = $area_name
        MERGE (st:Stadium {stadium_id: $stadium_id})
        ON CREATE SET st.name = $stadium_name
        SET st.name = $stadium_name
        MERGE (f:Field {field_id: $field_id})
        SET f.name = $field_name,
            f.price_per_hour = $price_per_hour,
            f.field_type_label = $field_type
        MERGE (f)-[:LOCATED_IN]->(a)
        MERGE (f)-[:BELONGS_TO]->(st)
        """,
        area_slug=district.lower().replace(" ", "_"),
        area_name=district,
        stadium_id=row["stadium_id"],
        stadium_name=row["stadium_name"],
        field_id=row["id"],
        field_name=row["name"],
        price_per_hour=float(row["price_per_hour"] or 0),
        field_type=row.get("type") or "",
    )


def main():
    try:
        mysql_conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "127.0.0.1"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            database=os.getenv("MYSQL_DATABASE", ""),
            user=os.getenv("MYSQL_USER", ""),
            password=os.getenv("MYSQL_PASSWORD", ""),
        )
        neo4j_driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            auth=(os.getenv("NEO4J_USERNAME", "neo4j"), os.getenv("NEO4J_PASSWORD", "")),
        )
    except Exception as exc:
        print(f"Connection setup error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

    try:
        rows = fetch_fields(mysql_conn)
        with neo4j_driver.session() as session:
            for row in rows:
                session.execute_write(upsert_field, row)
    except Exception as exc:
        print(f"Sync execution error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    finally:
        mysql_conn.close()
        neo4j_driver.close()

    print(json.dumps({"synced_fields": len(rows)}))


if __name__ == "__main__":
    main()

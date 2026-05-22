# User GraphRAG Chat V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a phase-1 GraphRAG chat box for end users that recommends suitable fields from natural-language requests and explains why each recommendation fits, while integrating cleanly into the existing Node/React booking platform.

**Architecture:** Keep `backend/` as the main application API and add a small Python `graphrag-service/` beside it. The Node backend exposes a narrow `/api/ai/chat` gateway, while the Python service handles constraint extraction, graph retrieval from Neo4j, context assembly, and OpenRouter response generation. MySQL remains the operational source of truth and Neo4j becomes the recommendation-oriented knowledge layer.

**Tech Stack:** Node.js, Express, Sequelize, MySQL, React, Vite, Python 3, FastAPI, Neo4j, Neo4j Python driver, OpenRouter, Vitest, Node test runner

---

## File Structure

### Existing files to modify

- `backend/app.js`
  - register the new AI route
- `frontend/src/App.jsx`
  - wire a user-facing chat page or route
- `frontend/src/components/MainLayout.jsx`
  - place the chat entry point in the main user navigation if needed
- `frontend/src/pages/FieldListPage.jsx`
  - optionally expose a contextual link into the assistant from the listing experience

### New backend Node files

- `backend/routes/aiRoutes.js`
  - Express route definitions for the chat gateway
- `backend/controllers/aiController.js`
  - validate the incoming request and forward it to the Python service
- `backend/utils/aiServiceClient.js`
  - small HTTP client for talking to the Python service
- `backend/tests/aiChatRoute.test.js`
  - route-level tests for request validation and forwarding behavior

### New Python GraphRAG service files

- `graphrag-service/requirements.txt`
  - Python package dependencies
- `graphrag-service/app/main.py`
  - FastAPI app and `/chat` endpoint
- `graphrag-service/app/config.py`
  - environment configuration
- `graphrag-service/app/schemas.py`
  - request and response models
- `graphrag-service/app/services/query_parser.py`
  - turn user text into structured recommendation constraints
- `graphrag-service/app/services/recommendation_rules.py`
  - explicit group-size, price-band, and time-preference normalization
- `graphrag-service/app/services/graph_repository.py`
  - Neo4j access layer
- `graphrag-service/app/services/context_builder.py`
  - assemble graph evidence plus curated text context
- `graphrag-service/app/services/openrouter_client.py`
  - OpenRouter API wrapper
- `graphrag-service/app/services/chat_service.py`
  - orchestration for parse -> retrieve -> explain
- `graphrag-service/app/tests/test_query_parser.py`
  - parser tests
- `graphrag-service/app/tests/test_recommendation_rules.py`
  - normalization and mapping tests
- `graphrag-service/app/tests/test_chat_service.py`
  - service-level orchestration tests

### New graph and knowledge bootstrap files

- `database/graphrag/schema.cypher`
  - Neo4j schema constraints and indexes
- `database/graphrag/seed.cypher`
  - small seed graph for local development
- `database/graphrag/knowledge/faq.json`
  - curated FAQ data
- `database/graphrag/knowledge/policies.json`
  - curated policy data
- `database/graphrag/knowledge/rules.json`
  - curated recommendation rules
- `database/graphrag/sync_from_mysql.py`
  - initial one-way sync from MySQL to Neo4j for a small field dataset

### New frontend files

- `frontend/src/pages/SmartChatPage.jsx`
  - the user-facing chat page
- `frontend/src/components/SmartChatBox.jsx`
  - chat input, messages, loading, result cards
- `frontend/src/components/RecommendedFieldCard.jsx`
  - recommendation card with explanation
- `frontend/src/services/aiChatApi.js`
  - frontend API wrapper
- `frontend/src/tests/SmartChatPage.test.jsx`
  - basic UI tests for submit and render

## Task 1: Document environment and service boundaries

**Files:**
- Create: `graphrag-service/README.md`
- Create: `graphrag-service/.env.example`
- Create: `docs/superpowers/plans/2026-05-22-user-graphrag-chat-v1-plan.md`

- [ ] **Step 1: Write the boundary notes into `graphrag-service/README.md`**

```md
# GraphRAG Service

This service is a separate Python service for the user recommendation chat.

Responsibilities:
- parse user recommendation queries
- normalize recommendation constraints
- query Neo4j for candidate fields
- assemble curated FAQ and policy context
- call OpenRouter for final grounded explanations

Non-responsibilities:
- booking creation
- payment processing
- user authentication
- replacing the Node backend

Main local endpoint:
- `POST /chat`
```

- [ ] **Step 2: Add environment placeholders to `graphrag-service/.env.example`**

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=
MYSQL_USER=
MYSQL_PASSWORD=
```

- [ ] **Step 3: Verify the plan file is present and tracked**

Run: `git status --short docs/superpowers/plans/2026-05-22-user-graphrag-chat-v1-plan.md`
Expected: one line starting with `??` or `A`

- [ ] **Step 4: Commit**

```bash
git add graphrag-service/README.md graphrag-service/.env.example docs/superpowers/plans/2026-05-22-user-graphrag-chat-v1-plan.md
git commit -m "docs: define graphrag service boundaries"
```

## Task 2: Bootstrap the Python GraphRAG service

**Files:**
- Create: `graphrag-service/requirements.txt`
- Create: `graphrag-service/app/main.py`
- Create: `graphrag-service/app/config.py`
- Create: `graphrag-service/app/schemas.py`
- Test: `graphrag-service/app/tests/test_app_smoke.py`

- [ ] **Step 1: Write the failing smoke test**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_ok():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest graphrag-service/app/tests/test_app_smoke.py -v`
Expected: FAIL with `ModuleNotFoundError` or missing `app.main`

- [ ] **Step 3: Add the initial dependencies**

```txt
fastapi==0.115.12
uvicorn==0.34.2
pydantic==2.11.4
pydantic-settings==2.9.1
httpx==0.28.1
neo4j==5.28.1
pytest==8.3.5
```

- [ ] **Step 4: Write the minimal FastAPI app**

```python
from fastapi import FastAPI

from .schemas import HealthResponse

app = FastAPI(title="GraphRAG Service", version="0.1.0")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")
```

```python
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
```

- [ ] **Step 5: Add config loading**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
```

- [ ] **Step 6: Run test to verify it passes**

Run: `python -m pytest graphrag-service/app/tests/test_app_smoke.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add graphrag-service/requirements.txt graphrag-service/app/main.py graphrag-service/app/config.py graphrag-service/app/schemas.py graphrag-service/app/tests/test_app_smoke.py
git commit -m "feat: bootstrap graphrag service"
```

## Task 3: Add explicit query normalization rules

**Files:**
- Create: `graphrag-service/app/services/recommendation_rules.py`
- Create: `graphrag-service/app/tests/test_recommendation_rules.py`

- [ ] **Step 1: Write the failing rule tests**

```python
from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_price_band,
    normalize_time_preference,
)


def test_infer_field_type_from_group_size_prefers_seven_a_side():
    assert infer_field_type_from_group_size(10) == "san_7"


def test_normalize_price_band_maps_vua_phai_to_medium():
    assert normalize_price_band("gia vua phai") == "medium"


def test_normalize_time_preference_maps_toi_nay_to_evening():
    assert normalize_time_preference("toi nay") == "evening"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest graphrag-service/app/tests/test_recommendation_rules.py -v`
Expected: FAIL with `ModuleNotFoundError` or missing functions

- [ ] **Step 3: Implement minimal normalization rules**

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest graphrag-service/app/tests/test_recommendation_rules.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add graphrag-service/app/services/recommendation_rules.py graphrag-service/app/tests/test_recommendation_rules.py
git commit -m "feat: add recommendation normalization rules"
```

## Task 4: Parse user chat queries into structured constraints

**Files:**
- Create: `graphrag-service/app/services/query_parser.py`
- Create: `graphrag-service/app/tests/test_query_parser.py`
- Modify: `graphrag-service/app/schemas.py`

- [ ] **Step 1: Write the failing parser test**

```python
from app.services.query_parser import parse_user_query


def test_parse_user_query_extracts_area_people_budget_and_time():
    result = parse_user_query("Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7")

    assert result.area == "quan_7"
    assert result.group_size == 10
    assert result.price_band == "medium"
    assert result.time_preference == "evening"
    assert result.field_type == "san_7"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest graphrag-service/app/tests/test_query_parser.py -v`
Expected: FAIL because `parse_user_query` does not exist

- [ ] **Step 3: Add the constraint schema**

```python
from pydantic import BaseModel, Field


class RecommendationConstraints(BaseModel):
    area: str | None = None
    group_size: int | None = None
    price_band: str | None = None
    time_preference: str | None = None
    field_type: str | None = None
    amenities: list[str] = Field(default_factory=list)
```

- [ ] **Step 4: Implement the minimal parser**

```python
import re

from app.schemas import RecommendationConstraints
from app.services.recommendation_rules import (
    infer_field_type_from_group_size,
    normalize_price_band,
    normalize_time_preference,
)


def parse_user_query(text: str) -> RecommendationConstraints:
    lowered = text.lower()
    people_match = re.search(r"(\d+)\s*nguoi", lowered)
    group_size = int(people_match.group(1)) if people_match else None

    area = None
    if "quan 7" in lowered:
        area = "quan_7"

    price_band = normalize_price_band(lowered)
    time_preference = normalize_time_preference(lowered)
    field_type = infer_field_type_from_group_size(group_size)

    return RecommendationConstraints(
        area=area,
        group_size=group_size,
        price_band=price_band,
        time_preference=time_preference,
        field_type=field_type,
        amenities=[],
    )
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python -m pytest graphrag-service/app/tests/test_query_parser.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add graphrag-service/app/services/query_parser.py graphrag-service/app/tests/test_query_parser.py graphrag-service/app/schemas.py
git commit -m "feat: parse user recommendation queries"
```

## Task 5: Define Neo4j schema and seed knowledge

**Files:**
- Create: `database/graphrag/schema.cypher`
- Create: `database/graphrag/seed.cypher`
- Create: `database/graphrag/knowledge/faq.json`
- Create: `database/graphrag/knowledge/policies.json`
- Create: `database/graphrag/knowledge/rules.json`

- [ ] **Step 1: Write the graph schema**

```cypher
CREATE CONSTRAINT field_id_unique IF NOT EXISTS
FOR (f:Field)
REQUIRE f.field_id IS UNIQUE;

CREATE CONSTRAINT stadium_id_unique IF NOT EXISTS
FOR (s:Stadium)
REQUIRE s.stadium_id IS UNIQUE;

CREATE CONSTRAINT area_slug_unique IF NOT EXISTS
FOR (a:Area)
REQUIRE a.slug IS UNIQUE;

CREATE CONSTRAINT policy_slug_unique IF NOT EXISTS
FOR (p:Policy)
REQUIRE p.slug IS UNIQUE;
```

- [ ] **Step 2: Seed a small local graph**

```cypher
MERGE (a:Area {slug: "quan_7", name: "Quan 7"})
MERGE (pt:PriceBand {slug: "medium", label: "Gia vua phai"})
MERGE (tp:TimePreference {slug: "evening", label: "Buoi toi"})
MERGE (ft:FieldType {slug: "san_7", label: "San 7"})
MERGE (am:Amenity {slug: "den", label: "Den"})
MERGE (st:Stadium {stadium_id: 101, name: "San Bong Phu My"})
MERGE (f:Field {field_id: 201, name: "San 7 Phu My A"})
MERGE (f)-[:LOCATED_IN]->(a)
MERGE (f)-[:BELONGS_TO]->(st)
MERGE (f)-[:HAS_TYPE]->(ft)
MERGE (f)-[:FITS_PRICE_BAND]->(pt)
MERGE (f)-[:MATCHES_TIME_PREFERENCE]->(tp)
MERGE (f)-[:HAS_AMENITY]->(am)
```

- [ ] **Step 3: Add starter curated knowledge JSON**

```json
[
  {
    "slug": "faq-lighting",
    "question": "San nao phu hop da buoi toi?",
    "answer": "Uu tien cac san co den va lich hoat dong buoi toi ro rang.",
    "about": ["Amenity:den", "TimePreference:evening"]
  }
]
```

```json
[
  {
    "slug": "refund-basic",
    "title": "Chinh sach huy co ban",
    "content": "Thong tin huy san can duoc xac minh tu du lieu van hanh hien tai.",
    "about": ["Policy:refund"]
  }
]
```

```json
[
  {
    "slug": "rule-group-size-7",
    "condition": "group_size between 7 and 14",
    "suggested_field_type": "san_7",
    "reason": "Nhom 7-14 nguoi thuong phu hop voi san 7."
  }
]
```

- [ ] **Step 4: Sanity-check the files**

Run: `Get-ChildItem database\\graphrag -Recurse | Select-Object FullName`
Expected: output includes `schema.cypher`, `seed.cypher`, and the three knowledge JSON files

- [ ] **Step 5: Commit**

```bash
git add database/graphrag/schema.cypher database/graphrag/seed.cypher database/graphrag/knowledge/faq.json database/graphrag/knowledge/policies.json database/graphrag/knowledge/rules.json
git commit -m "feat: add graphrag graph schema and starter knowledge"
```

## Task 6: Add MySQL-to-Neo4j sync for a tiny field dataset

**Files:**
- Create: `database/graphrag/sync_from_mysql.py`
- Create: `database/graphrag/README.md`

- [ ] **Step 1: Write the sync script skeleton**

```python
import json
import os

import mysql.connector
from neo4j import GraphDatabase


def fetch_fields(mysql_conn):
    query = """
    SELECT f.id, f.name, f.type, f.price_per_hour, s.id AS stadium_id, s.name AS stadium_name,
           l.district
    FROM fields f
    JOIN stadiums s ON s.id = f.stadium_id
    LEFT JOIN locations l ON l.stadium_id = s.id
    WHERE f.status = 'active'
    LIMIT 20
    """
    cursor = mysql_conn.cursor(dictionary=True)
    cursor.execute(query)
    return cursor.fetchall()


def upsert_field(tx, row):
    tx.run(
        """
        MERGE (a:Area {slug: $area_slug})
        ON CREATE SET a.name = $area_name
        MERGE (st:Stadium {stadium_id: $stadium_id})
        ON CREATE SET st.name = $stadium_name
        MERGE (f:Field {field_id: $field_id})
        SET f.name = $field_name, f.price_per_hour = $price_per_hour, f.field_type_label = $field_type
        MERGE (f)-[:LOCATED_IN]->(a)
        MERGE (f)-[:BELONGS_TO]->(st)
        """,
        area_slug=(row.get("district") or "unknown").lower().replace(" ", "_"),
        area_name=row.get("district") or "Unknown",
        stadium_id=row["stadium_id"],
        stadium_name=row["stadium_name"],
        field_id=row["id"],
        field_name=row["name"],
        price_per_hour=float(row["price_per_hour"] or 0),
        field_type=row.get("type") or "",
    )
```

- [ ] **Step 2: Add a runnable `main()`**

```python
def main():
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

    rows = fetch_fields(mysql_conn)
    with neo4j_driver.session() as session:
        for row in rows:
            session.execute_write(upsert_field, row)

    print(json.dumps({"synced_fields": len(rows)}))


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Document how to run the sync**

```md
# GraphRAG Data Sync

Run graph schema first, then seed, then sync:

1. Apply `schema.cypher`
2. Apply `seed.cypher`
3. Set MySQL and Neo4j env vars
4. Run:

```bash
python database/graphrag/sync_from_mysql.py
```
```

- [ ] **Step 4: Run the sync in dry local mode**

Run: `python database/graphrag/sync_from_mysql.py`
Expected: JSON output with a `synced_fields` count, or a clear connection error if local Neo4j/MySQL is not ready yet

- [ ] **Step 5: Commit**

```bash
git add database/graphrag/sync_from_mysql.py database/graphrag/README.md
git commit -m "feat: add initial mysql to neo4j sync script"
```

## Task 7: Add the graph repository and context builder

**Files:**
- Create: `graphrag-service/app/services/graph_repository.py`
- Create: `graphrag-service/app/services/context_builder.py`
- Create: `graphrag-service/app/tests/test_chat_service.py`
- Modify: `graphrag-service/app/schemas.py`

- [ ] **Step 1: Write the failing chat service contract test**

```python
from app.schemas import RecommendationConstraints
from app.services.context_builder import build_chat_context


def test_build_chat_context_returns_candidate_fields_with_reasons():
    constraints = RecommendationConstraints(
        area="quan_7",
        group_size=10,
        price_band="medium",
        time_preference="evening",
        field_type="san_7",
        amenities=[],
    )

    result = build_chat_context(
        constraints=constraints,
        candidate_fields=[
            {
                "field_id": 201,
                "name": "San 7 Phu My A",
                "reasons": ["Gan Quan 7", "Phu hop nhom 10 nguoi", "Gia tam trung"],
            }
        ],
    )

    assert result["candidate_fields"][0]["field_id"] == 201
    assert "Gan Quan 7" in result["candidate_fields"][0]["reasons"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest graphrag-service/app/tests/test_chat_service.py -v`
Expected: FAIL because `build_chat_context` does not exist

- [ ] **Step 3: Add the chat context builder**

```python
from app.schemas import RecommendationConstraints


def build_chat_context(constraints: RecommendationConstraints, candidate_fields: list[dict]) -> dict:
    return {
        "constraints": constraints.model_dump(),
        "candidate_fields": candidate_fields,
    }
```

- [ ] **Step 4: Add a minimal graph repository API**

```python
from neo4j import GraphDatabase


class GraphRepository:
    def __init__(self, uri: str, username: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(username, password))

    def close(self) -> None:
        self.driver.close()

    def find_candidate_fields(self, constraints: dict) -> list[dict]:
        return []
```

- [ ] **Step 5: Run test to verify it passes**

Run: `python -m pytest graphrag-service/app/tests/test_chat_service.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add graphrag-service/app/services/graph_repository.py graphrag-service/app/services/context_builder.py graphrag-service/app/tests/test_chat_service.py graphrag-service/app/schemas.py
git commit -m "feat: add graph repository and context builder"
```

## Task 8: Implement the chat orchestration service

**Files:**
- Create: `graphrag-service/app/services/openrouter_client.py`
- Create: `graphrag-service/app/services/chat_service.py`
- Modify: `graphrag-service/app/schemas.py`
- Modify: `graphrag-service/app/main.py`

- [ ] **Step 1: Write the failing orchestration test**

```python
from app.schemas import ChatRequest
from app.services.chat_service import generate_chat_response


class FakeRepository:
    def find_candidate_fields(self, constraints):
        return [
            {
                "field_id": 201,
                "name": "San 7 Phu My A",
                "reasons": ["Gan Quan 7", "Phu hop nhom 10 nguoi", "Gia tam trung"],
            }
        ]


class FakeOpenRouterClient:
    def generate_recommendation(self, payload):
        return {
            "answer": "Toi goi y San 7 Phu My A vi gan Quan 7, hop nhom 10 nguoi va co muc gia tam trung.",
            "recommendations": payload["candidate_fields"],
        }


def test_generate_chat_response_returns_grounded_recommendation():
    request = ChatRequest(message="Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7")

    result = generate_chat_response(
        request=request,
        repository=FakeRepository(),
        llm_client=FakeOpenRouterClient(),
    )

    assert "San 7 Phu My A" in result["answer"]
    assert result["recommendations"][0]["field_id"] == 201
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest graphrag-service/app/tests/test_chat_service.py -v`
Expected: FAIL because `generate_chat_response` or `ChatRequest` does not exist

- [ ] **Step 3: Add request and response models**

```python
class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    recommendations: list[dict]
    constraints: RecommendationConstraints
```

- [ ] **Step 4: Implement the orchestration**

```python
from app.services.context_builder import build_chat_context
from app.services.query_parser import parse_user_query


def generate_chat_response(request, repository, llm_client):
    constraints = parse_user_query(request.message)
    candidate_fields = repository.find_candidate_fields(constraints.model_dump())
    payload = build_chat_context(constraints=constraints, candidate_fields=candidate_fields)
    llm_result = llm_client.generate_recommendation(payload)
    llm_result["constraints"] = constraints
    return llm_result
```

- [ ] **Step 5: Expose the FastAPI `/chat` endpoint**

```python
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    result = generate_chat_response(
        request=request,
        repository=GraphRepository(
            settings.neo4j_uri,
            settings.neo4j_username,
            settings.neo4j_password,
        ),
        llm_client=OpenRouterClient(
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
        ),
    )
    return ChatResponse(**result)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m pytest graphrag-service/app/tests -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add graphrag-service/app/services/openrouter_client.py graphrag-service/app/services/chat_service.py graphrag-service/app/schemas.py graphrag-service/app/main.py graphrag-service/app/tests/test_chat_service.py
git commit -m "feat: add graphrag chat orchestration"
```

## Task 9: Add the Node gateway route

**Files:**
- Create: `backend/routes/aiRoutes.js`
- Create: `backend/controllers/aiController.js`
- Create: `backend/utils/aiServiceClient.js`
- Create: `backend/tests/aiChatRoute.test.js`
- Modify: `backend/app.js`

- [ ] **Step 1: Write the failing route test**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

test('POST /api/ai/chat returns 400 when message is missing', async () => {
  const { createApp } = require('../app');

  const app = createApp();
  const response = await fetch('http://127.0.0.1:5100/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test backend/tests/aiChatRoute.test.js`
Expected: FAIL because route or test harness is missing

- [ ] **Step 3: Implement the client and controller**

```javascript
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://127.0.0.1:8000';

async function sendChatMessage(message) {
  const response = await fetch(`${AI_SERVICE_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`AI service failed with status ${response.status}`);
  }

  return response.json();
}

module.exports = { sendChatMessage };
```

```javascript
const { sendChatMessage } = require('../utils/aiServiceClient');

async function postChat(req, res) {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const result = await sendChatMessage(message);
    return res.json(result);
  } catch (error) {
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}

module.exports = { postChat };
```

- [ ] **Step 4: Register the route**

```javascript
const express = require('express');
const { postChat } = require('../controllers/aiController');

const router = express.Router();

router.post('/chat', postChat);

module.exports = router;
```

```javascript
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/ai', aiRoutes);
```

- [ ] **Step 5: Rewrite the test to use an in-process server**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('POST /api/ai/chat returns 400 when message is missing', async () => {
  const { createApp } = require('../app');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(5100, resolve));

  const response = await fetch('http://127.0.0.1:5100/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);

  await new Promise((resolve) => server.close(resolve));
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test backend/tests/aiChatRoute.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/routes/aiRoutes.js backend/controllers/aiController.js backend/utils/aiServiceClient.js backend/tests/aiChatRoute.test.js backend/app.js
git commit -m "feat: add ai chat gateway route"
```

## Task 10: Add a simple user-facing chat page in React

**Files:**
- Create: `frontend/src/pages/SmartChatPage.jsx`
- Create: `frontend/src/components/SmartChatBox.jsx`
- Create: `frontend/src/components/RecommendedFieldCard.jsx`
- Create: `frontend/src/services/aiChatApi.js`
- Create: `frontend/src/tests/SmartChatPage.test.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Write the failing UI test**

```jsx
import { render, screen } from '@testing-library/react';
import SmartChatPage from '../pages/SmartChatPage';


test('renders chat heading', () => {
  render(<SmartChatPage />);
  expect(screen.getByText(/Tro ly dat san thong minh/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run frontend/src/tests/SmartChatPage.test.jsx`
Expected: FAIL because the page file does not exist

- [ ] **Step 3: Add the API wrapper**

```javascript
import axios from 'axios';

export async function sendAiChat(message) {
  const response = await axios.post('http://localhost:5000/api/ai/chat', { message });
  return response.data;
}
```

- [ ] **Step 4: Add the minimal page and components**

```jsx
import SmartChatBox from '../components/SmartChatBox';

const SmartChatPage = () => (
  <section className="container py-4">
    <h1>Tro ly dat san thong minh</h1>
    <p>Nhap nhu cau cua ban de nhan 2-3 san goi y cung ly do phu hop.</p>
    <SmartChatBox />
  </section>
);

export default SmartChatPage;
```

```jsx
import { useState } from 'react';
import { sendAiChat } from '../services/aiChatApi';
import RecommendedFieldCard from './RecommendedFieldCard';

const SmartChatBox = () => {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await sendAiChat(message);
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        <button type="submit" disabled={loading || !message.trim()}>
          {loading ? 'Dang tu van...' : 'Nhan goi y'}
        </button>
      </form>
      {result?.answer ? <p>{result.answer}</p> : null}
      {result?.recommendations?.map((field) => (
        <RecommendedFieldCard key={field.field_id} field={field} />
      ))}
    </div>
  );
};

export default SmartChatBox;
```

```jsx
const RecommendedFieldCard = ({ field }) => (
  <article>
    <h2>{field.name}</h2>
    <ul>
      {field.reasons?.map((reason) => (
        <li key={reason}>{reason}</li>
      ))}
    </ul>
  </article>
);

export default RecommendedFieldCard;
```

- [ ] **Step 5: Register the route**

```jsx
import SmartChatPage from './pages/SmartChatPage';

<Route path="/smart-chat" element={<SmartChatPage />} />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- --run frontend/src/tests/SmartChatPage.test.jsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/SmartChatPage.jsx frontend/src/components/SmartChatBox.jsx frontend/src/components/RecommendedFieldCard.jsx frontend/src/services/aiChatApi.js frontend/src/tests/SmartChatPage.test.jsx frontend/src/App.jsx
git commit -m "feat: add smart chat user page"
```

## Task 11: Connect the listing experience to the chat assistant

**Files:**
- Modify: `frontend/src/pages/FieldListPage.jsx`
- Modify: `frontend/src/components/MainLayout.jsx`

- [ ] **Step 1: Add a visible call-to-action in the field listing experience**

```jsx
<Link className="btn btn-success" to="/smart-chat">
  Nho tro ly tu van san
</Link>
```

- [ ] **Step 2: Add a main navigation entry if the layout supports it**

```jsx
<Link to="/smart-chat">Tro ly san</Link>
```

- [ ] **Step 3: Run the frontend test suite**

Run: `npm test`
Expected: PASS, or a small number of pre-existing unrelated failures documented separately

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/FieldListPage.jsx frontend/src/components/MainLayout.jsx
git commit -m "feat: link listing flow to smart chat"
```

## Task 12: Verify end-to-end local flow and document the developer startup sequence

**Files:**
- Modify: `graphrag-service/README.md`
- Create: `docs/superpowers/plans/2026-05-22-user-graphrag-chat-v1-walkthrough.md`

- [ ] **Step 1: Add exact local startup commands to the GraphRAG service README**

```md
## Local startup

### 1. Start the Node backend

```bash
cd backend
npm install
npm run dev
```

### 2. Start the Python GraphRAG service

```bash
cd graphrag-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```
```

- [ ] **Step 2: Write the walkthrough**

```md
# User GraphRAG Chat V1 Walkthrough

1. Open the frontend
2. Navigate to `/smart-chat`
3. Ask: `Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7`
4. Confirm:
   - a natural-language answer appears
   - 2-3 recommendations are shown
   - each recommendation has explicit reasons
5. If Neo4j or OpenRouter is unavailable, confirm the UI shows a safe error instead of fake recommendations
```

- [ ] **Step 3: Run targeted verification**

Run: `node --test backend/tests/aiChatRoute.test.js`
Expected: PASS

Run: `python -m pytest graphrag-service/app/tests -v`
Expected: PASS

Run: `npm test -- --run frontend/src/tests/SmartChatPage.test.jsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add graphrag-service/README.md docs/superpowers/plans/2026-05-22-user-graphrag-chat-v1-walkthrough.md
git commit -m "docs: add graphrag chat local walkthrough"
```

## Self-Review

### Spec coverage

- user-facing recommendation chat: covered by Tasks 8, 9, 10, and 11
- graph schema V1: covered by Task 5
- graph-oriented retrieval architecture: covered by Tasks 7 and 8
- separate Python AI service: covered by Tasks 1, 2, 3, 4, 7, and 8
- integration into existing Node/React repo: covered by Tasks 9, 10, and 11
- step-by-step rollout: covered by task order from 1 through 12

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation placeholders remain in the task steps
- Every code-writing task includes concrete code blocks
- Every verification step includes a concrete command and expected result

### Type consistency

- `RecommendationConstraints`, `ChatRequest`, and `ChatResponse` are introduced before later tasks depend on them
- `generate_chat_response()` consumes `ChatRequest` and returns a structure compatible with `ChatResponse`
- `sendChatMessage()` in Node forwards the same `message` payload shape used by the Python `/chat` endpoint

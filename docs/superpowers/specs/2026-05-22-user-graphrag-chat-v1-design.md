# User GraphRAG Chat V1 Design

Date: 2026-05-22
Project: He-Thong-Dat-Xan-develop
Scope: GraphRAG-powered user chat box for field recommendation with explanations
Status: Draft approved in conversation, awaiting user review of written spec

## 1. Goal

Build a phase-1 smart chat box for end users that can recommend suitable fields based on natural-language requests and explain why each recommendation fits.

The feature should feel like an in-product booking assistant, not a generic chatbot.

Phase 1 should help users with:

- finding suitable fields from natural-language queries
- understanding why a field is recommended
- asking about field details, amenities, and related policies
- receiving recommendations grounded in system data plus curated business knowledge

The long-term direction is GraphRAG, not plain vector RAG, because the system needs to reason over relationships such as area, field type, price range, time preference, amenities, and recommendation rules.

## 2. Confirmed Direction

The feature follows these confirmed decisions:

- The primary audience for V1 is `user dat san`
- The main value of V1 is `goi y san theo ngu canh`
- The reply style should `giai thich ro vi sao tung san phu hop`
- V1 should use:
  - existing system data
  - curated business knowledge added manually
- Curated knowledge may include:
  - FAQ
  - cancellation or refund policies
  - richer field descriptions
  - recommendation rules
  - guidance notes such as when a field is better for evening play
- V1 does not prioritize personalization from user behavior history
- The existing repo architecture should be preserved rather than replaced
- The current Node/Express backend and React frontend remain the main application stack
- Neo4j should be introduced as a graph layer for recommendation reasoning
- OpenRouter should be used for LLM calls

## 3. Recommended Approach

The chosen direction is `minimal GraphRAG for user recommendation and explanation`.

Why this approach:

- It aligns with the user's real product goal rather than shipping a plain FAQ bot.
- It keeps the current booking platform stable by adding a focused AI subsystem instead of rewriting the stack.
- It uses graph structure where graph reasoning actually matters: recommendation constraints and explainability.
- It keeps phase-1 scope small enough to learn step by step while still being meaningfully different from standard RAG.

Approaches considered but not chosen:

- `Plain RAG plus prompt rules`: faster to start, but too weak for relationship-based recommendation and stable explanation quality
- `Metadata filter plus LLM`: practical and controllable, but only partially benefits from graph reasoning
- `Full personalization from user behavior in V1`: valuable later, but too large and noisy for the first iteration

## 4. Scope

### 4.1 In scope

- user-facing chat box for booking assistance
- natural-language queries about field needs
- recommendation of 2-3 suitable fields
- explanation of why each recommendation matches the request
- answers grounded in:
  - field data from the system
  - curated knowledge documents and rules
- graph modeling for recommendation reasoning
- retrieval that combines graph lookup and text context
- backend integration through the existing application stack

### 4.2 Out of scope

- admin-facing analytics chat
- owner-facing operational assistant
- deep personalization from user history
- full conversational agent behavior with many clarification turns
- real-time orchestration over all booking transactions
- replacing the current backend with FastAPI
- broad AI features unrelated to field recommendation

## 5. User Experience

The user experience for phase 1 should be simple:

1. User asks for a field in natural language
2. The system extracts needs such as area, group size, time, budget, and amenities
3. The system returns 2-3 recommended fields
4. Each recommendation includes a short explanation of why it fits
5. The answer may also include relevant notes about policies or trade-offs when needed

Expected example behavior:

- "Toi muon da toi nay, khoang 10 nguoi, gia vua phai, gan Quan 7"
- The assistant should recommend a small set of matching fields
- The assistant should explain concrete reasons such as area match, field type fit, evening suitability, and price range

Phase 1 answer style should prioritize:

- concise recommendation
- explicit reasoning
- grounded facts over generic wording

It should not yet behave like a complex multi-step planner that keeps asking follow-up questions unless that becomes necessary later.

## 6. Knowledge Sources

Phase 1 should combine two knowledge families.

### 6.1 System data

The existing platform data can provide:

- field name
- stadium or location
- area
- field type
- price
- amenities
- basic booking-related availability signals when appropriate
- ratings or review summaries when later mapped cleanly

### 6.2 Curated business knowledge

Additional knowledge should be authored and maintained explicitly, for example:

- FAQ entries
- refund and cancellation policy explanations
- richer field descriptions
- recommendation rules such as preferred field type by group size
- notes such as which fields are more suitable for evening play

This second knowledge layer is important because many high-quality explanations are not present in raw operational tables.

## 7. Graph Schema V1

The graph should only model the concepts needed for recommendation and explanation in V1.

### 7.1 Core entities

- `Field`
- `Stadium`
- `Area`
- `FieldType`
- `Amenity`
- `Policy`
- `FAQ`
- `RecommendationRule`
- `PriceBand`
- `TimePreference`

### 7.2 Core relationships

- `(:Field)-[:LOCATED_IN]->(:Area)`
- `(:Field)-[:BELONGS_TO]->(:Stadium)`
- `(:Field)-[:HAS_TYPE]->(:FieldType)`
- `(:Field)-[:HAS_AMENITY]->(:Amenity)`
- `(:Field)-[:FITS_PRICE_BAND]->(:PriceBand)`
- `(:Field)-[:MATCHES_TIME_PREFERENCE]->(:TimePreference)`
- `(:Field)-[:GOVERNED_BY]->(:Policy)`
- `(:FAQ)-[:ABOUT]->(:Field | :Policy | :Amenity | :Stadium)`
- `(:RecommendationRule)-[:APPLIES_TO]->(:FieldType | :Amenity | :PriceBand | :TimePreference)`
- `(:RecommendationRule)-[:SUGGESTS]->(:Field)` when explicit field suggestions are useful

### 7.3 Why this schema fits phase 1

- It supports recommendation queries such as area, people count, time, and budget.
- It supports explanation by exposing the relationships behind each recommendation.
- It can store curated knowledge cleanly without forcing everything into raw text chunks.
- It stays intentionally smaller than the full product database.

### 7.4 What should not be pushed into the graph yet

- all transaction tables
- full user-behavior personalization
- chat history memory
- every MySQL table by default

MySQL should remain the operational source of truth, while Neo4j should hold the recommendation-oriented knowledge layer.

## 8. Retrieval And Response Flow

Phase 1 should use a graph-first retrieval flow with text support.

### 8.1 Input understanding

The system receives a natural-language request such as:

- desired area
- group size
- time preference
- budget
- optional amenities or convenience needs

### 8.2 Constraint extraction

The AI layer should extract or infer structured constraints, for example:

- `10 nguoi` -> likely `san 7`
- `toi nay` -> `evening`
- `gia vua phai` -> `medium price band`
- `gan Quan 7` -> `Area = Quan 7` or near-match logic later

### 8.3 Graph retrieval

Neo4j should be queried to find candidate fields that satisfy or closely match the constraints through the graph relationships.

### 8.4 Text augmentation

After candidate fields are found, the system should add supporting context such as:

- field descriptions
- FAQ entries
- policies
- recommendation notes

### 8.5 Ranking

The system should rank and keep only 2-3 strong candidates for response generation.

### 8.6 LLM generation

OpenRouter should be used after retrieval, not as the initial search engine.

The LLM should receive:

- the original user query
- extracted constraints
- candidate fields
- graph-backed reasons
- supplemental text context

It should then generate:

- a short recommendation list
- an explanation for each recommendation
- relevant caveats or policy notes when necessary

## 9. Integration Architecture

The current repo should be extended rather than restructured.

### 9.1 Existing layers to keep

- `frontend` remains the user-facing React/Vite app
- `backend` remains the main Node/Express API layer
- `MySQL` remains the operational database

### 9.2 New AI layer

The recommended integration is a separate Python service, for example `ai-service/` or `graphrag-service/`.

Why Python is recommended:

- better ergonomics for GraphRAG pipelines
- easier Neo4j integration and experimentation
- easier future extension for extraction, evaluation, or embeddings
- isolates AI complexity from the existing booking backend

### 9.3 Suggested responsibilities

`frontend`

- shows the chat box
- sends chat requests
- renders recommended fields and explanations

`backend Node/Express`

- exposes a route such as `/api/ai/chat`
- performs app-level auth or request shaping if needed
- forwards AI requests to the Python service
- returns the AI response to the frontend

`AI service Python`

- parses the request
- extracts constraints
- queries Neo4j
- enriches context from curated knowledge and supporting data
- calls OpenRouter
- formats the structured response

`Neo4j`

- stores recommendation-oriented graph knowledge

`MySQL`

- remains the operational source, and selected data can be synced into the graph layer

## 10. Error Handling And Safety

Phase 1 should keep failure behavior predictable:

- if graph retrieval fails, the system should fail gracefully rather than invent unsupported claims
- if the query is too vague, the system may still recommend best-effort options but should acknowledge uncertainty
- if a requested detail is missing, the assistant should avoid pretending it knows
- if policy data is unavailable, recommendation text should not fabricate policy terms

The assistant should always prefer grounded recommendation over fluent but unsupported answers.

## 11. Testing Strategy

Phase 1 testing should focus on behavior, not only infrastructure.

Core checks should include:

- extraction of main constraints from representative user queries
- graph retrieval returns the expected candidate fields
- response generation includes grounded reasons tied to retrieved data
- policy and FAQ augmentation appear only when relevant
- fallback behavior stays safe when data is incomplete

Test scenarios should cover:

- area-focused queries
- budget-focused queries
- group-size mapping queries
- evening-play queries
- requests with amenity constraints
- requests with incomplete information

## 12. Step-By-Step Delivery Roadmap

The implementation should follow a learning-oriented sequence.

### 12.1 Stage 1: clarify product and recommendation rules

- finalize V1 scope
- define recommendation logic for group size, price bands, and time preference
- list the curated knowledge that must exist for good explanations

### 12.2 Stage 2: set up Neo4j

- install and run Neo4j locally
- verify Python connection
- create sample nodes and relationships

### 12.3 Stage 3: define graph data mapping

- map current MySQL concepts into the V1 graph schema
- decide which fields or tables become graph nodes, properties, or relationships
- define the curated knowledge input format

### 12.4 Stage 4: build a small ingestion pipeline

- start with a tiny dataset
- sync a few real fields into Neo4j
- add a few curated FAQ and policy entries
- add a few recommendation rules

### 12.5 Stage 5: build the retrieval pipeline

- parse natural-language query
- normalize constraints
- query graph
- fetch supporting text context
- rank candidate fields

### 12.6 Stage 6: connect OpenRouter

- create prompt inputs from retrieved context
- generate recommendation explanations
- validate that responses stay grounded

### 12.7 Stage 7: integrate with the app

- add the AI chat route in the existing backend
- connect the route to the Python service
- add a simple chat UI in the frontend

### 12.8 Stage 8: evaluate and refine

- review recommendation quality
- refine graph schema or rules where explanations feel weak
- improve data coverage before adding more advanced AI behavior

## 13. Implementation Guidance

This project should be built incrementally.

The first milestone is not "full smart assistant".
The first milestone is:

- a working graph
- a working retrieval flow
- 2-3 good recommendations
- clear explanation grounded in known data

That milestone is enough to prove the architecture before expanding into:

- richer policies
- more nuanced ranking
- personalization
- admin or owner AI features

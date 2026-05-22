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


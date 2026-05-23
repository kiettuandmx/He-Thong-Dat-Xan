# Chatbox Real Field Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make chatbox recommendations clickable real-field cards that open the existing field detail page, while preventing dev-only fallback data from appearing as production recommendations.

**Architecture:** Tighten the GraphRAG repository so chat recommendations only use live field records, then update the frontend compact recommendation card to render as a full-card React Router link when a valid `field_id` exists. Keep the current chat streaming flow intact and treat missing or invalid real-field ids as non-renderable recommendation items instead of dead links.

**Tech Stack:** React 19, React Router, Vitest, Node/Express proxy, FastAPI GraphRAG service, Neo4j repository layer

---

## File Structure

- Modify: `frontend/src/components/RecommendedFieldCard.jsx`
  Responsibility: Render recommendation cards, including the compact clickable variant used inside chat.

- Modify: `frontend/src/components/SmartChatBox.jsx`
  Responsibility: Render assistant recommendations and filter out items that cannot safely link to a field detail page.

- Modify: `frontend/src/tests/SmartChatPage.test.jsx`
  Responsibility: Verify chatbox recommendation cards render as clickable links only when valid real field ids exist.

- Modify: `graphrag-service/app/services/graph_repository.py`
  Responsibility: Return live repository candidates only, without silently substituting dev candidate data.

- Modify: `graphrag-service/app/tests/test_chat_service.py`
  Responsibility: Verify recommendation responses still work with live-style candidates and that clarification behavior remains intact.

- Modify: `graphrag-service/app/tests/test_openrouter_client.py`
  Responsibility: Update or remove tests that depend on dev fallback behavior if they no longer match the production-safe design.

## Task 1: Remove Dev Candidate Fallback From Graph Repository

**Files:**
- Modify: `graphrag-service/app/services/graph_repository.py`
- Test: `graphrag-service/app/tests/test_chat_service.py`

- [ ] **Step 1: Write the failing repository behavior test**

Add a test to `graphrag-service/app/tests/test_chat_service.py` that proves recommendation results do not silently come from dev fallback data when repository access fails.

```python
class FailingRepository:
    last_constraints = None

    def find_candidate_fields(self, constraints):
        self.last_constraints = constraints
        return []


def test_generate_chat_response_returns_no_recommendations_when_repository_has_no_live_matches():
    request = ChatRequest(message="san bong da quan 7 gia vua phai")

    result = generate_chat_response(
        request=request,
        repository=FailingRepository(),
        llm_client=FakeOpenRouterClient(),
    )

    assert result["recommendations"] == []
```

- [ ] **Step 2: Run test to verify current behavior gap**

Run: `pytest graphrag-service/app/tests/test_chat_service.py::test_generate_chat_response_returns_no_recommendations_when_repository_has_no_live_matches -v`

Expected: PASS or FAIL depending on current fake setup, but this locks the desired no-fallback behavior in place before touching repository code.

- [ ] **Step 3: Remove dev candidate loading and fallback logic**

Update `graphrag-service/app/services/graph_repository.py` so the class no longer loads `dev_candidates.json` and no longer returns `_match_dev_candidates(constraints)` from the exception path.

```python
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
```

- [ ] **Step 4: Run targeted Python tests**

Run: `pytest graphrag-service/app/tests/test_chat_service.py -v`

Expected: PASS, including the new no-fallback behavior and existing clarification tests.

- [ ] **Step 5: Commit**

```bash
git add graphrag-service/app/services/graph_repository.py graphrag-service/app/tests/test_chat_service.py
git commit -m "refactor: remove dev fallback candidates from chat recommendations"
```

## Task 2: Make Compact Recommendation Cards Clickable

**Files:**
- Modify: `frontend/src/components/RecommendedFieldCard.jsx`
- Test: `frontend/src/tests/SmartChatPage.test.jsx`

- [ ] **Step 1: Write the failing frontend test for clickable chat recommendations**

Add a test to `frontend/src/tests/SmartChatPage.test.jsx` that proves a compact recommendation card renders as a link to the field detail page.

```jsx
import { MemoryRouter } from 'react-router-dom';
import RecommendedFieldCard from '../components/RecommendedFieldCard';

test('renders compact recommendation cards as links when field_id is present', () => {
  render(
    <MemoryRouter>
      <RecommendedFieldCard
        compact
        field={{
          field_id: 12,
          name: 'San Bong Da',
          reasons: ['Gan khu vuc Quan 10'],
        }}
      />
    </MemoryRouter>
  );

  expect(screen.getByRole('link', { name: /san bong da/i })).toHaveAttribute('href', '/field/12');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SmartChatPage.test.jsx`

Expected: FAIL because `RecommendedFieldCard` currently renders an `article`, not a `Link`.

- [ ] **Step 3: Render the compact card as a React Router link**

Update `frontend/src/components/RecommendedFieldCard.jsx` to render the root as a `Link` when `compact` is true and `field.field_id` is present.

```jsx
import { Link } from 'react-router-dom';

const RecommendedFieldCard = ({ field, compact = false }) => {
  const className = compact ? 'recommended-field recommended-field--compact' : 'recommended-field';
  const content = (
    <>
      <div className="recommended-field__head">
        <h3 className="recommended-field__name">{field.name}</h3>
        <span className="recommended-field__tag">De xuat</span>
      </div>
      <ul className="recommended-field__reasons">
        {field.reasons?.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </>
  );

  if (compact && field.field_id) {
    return (
      <Link className={`${className} recommended-field--link`} to={`/field/${field.field_id}`}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
};
```

- [ ] **Step 4: Run frontend tests**

Run: `npm test -- SmartChatPage.test.jsx`

Expected: PASS with the new link test and existing chatbox interaction tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/RecommendedFieldCard.jsx frontend/src/tests/SmartChatPage.test.jsx
git commit -m "feat: link chat recommendations to field detail pages"
```

## Task 3: Filter Out Dead Recommendation Links In Chat UI

**Files:**
- Modify: `frontend/src/components/SmartChatBox.jsx`
- Modify: `frontend/src/tests/SmartChatPage.test.jsx`

- [ ] **Step 1: Write the failing test for invalid recommendation items**

Add a test proving that chat recommendations without `field_id` are not rendered as clickable cards.

```jsx
test('does not render broken clickable recommendations when field_id is missing', () => {
  render(
    <MemoryRouter>
      <RecommendedFieldCard
        compact
        field={{
          name: 'San khong co id',
          reasons: ['Du lieu khong hop le'],
        }}
      />
    </MemoryRouter>
  );

  expect(screen.queryByRole('link', { name: /san khong co id/i })).not.toBeInTheDocument();
  expect(screen.getByText(/san khong co id/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify current edge behavior**

Run: `npm test -- SmartChatPage.test.jsx`

Expected: FAIL if the component still assumes all compact cards should behave the same.

- [ ] **Step 3: Filter assistant recommendations before rendering**

Update `frontend/src/components/SmartChatBox.jsx` so the compact chat render only maps recommendation items with a numeric or truthy `field_id`.

```jsx
{entry.role === 'assistant' && entry.recommendations?.length ? (
  <div className="chat-message__recommendations">
    {entry.recommendations
      .filter((field) => field?.field_id)
      .map((field) => (
        <RecommendedFieldCard key={field.field_id} field={field} compact />
      ))}
  </div>
) : null}
```

- [ ] **Step 4: Run frontend tests again**

Run: `npm test -- SmartChatPage.test.jsx`

Expected: PASS, including valid-link and invalid-recommendation cases.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SmartChatBox.jsx frontend/src/tests/SmartChatPage.test.jsx
git commit -m "fix: suppress invalid chat recommendation links"
```

## Task 4: Add Interactive Styling For Full-Card Navigation

**Files:**
- Modify: `frontend/src/components/SmartChatBox.css`
- Test: `frontend/src/tests/SmartChatPage.test.jsx`

- [ ] **Step 1: Write the failing style-structure test**

Add a small assertion that the clickable card still renders readable content and exposes link semantics.

```jsx
test('clickable compact recommendation preserves reasons content', () => {
  render(
    <MemoryRouter>
      <RecommendedFieldCard
        compact
        field={{
          field_id: 33,
          name: 'San 7 Phu My',
          reasons: ['Gan khu vuc Quan 7', 'Muc gia Gia vua phai'],
        }}
      />
    </MemoryRouter>
  );

  expect(screen.getByRole('link', { name: /san 7 phu my/i })).toBeInTheDocument();
  expect(screen.getByText(/Gan khu vuc Quan 7/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify safety before styling**

Run: `npm test -- SmartChatPage.test.jsx`

Expected: PASS or FAIL depending on previous tasks, but this locks content visibility before CSS changes.

- [ ] **Step 3: Add explicit interactive styles for the link variant**

Update `frontend/src/components/SmartChatBox.css` so the clickable recommendation card looks like an intentional full-card action.

```css
.recommended-field--link {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.recommended-field--link:hover,
.recommended-field--link:focus-visible {
  transform: translateY(-1px);
  border-color: rgba(47, 143, 78, 0.28);
  box-shadow: 0 10px 22px rgba(35, 114, 66, 0.12);
  outline: none;
}
```

- [ ] **Step 4: Run frontend tests and a production build**

Run:

```bash
npm test -- SmartChatPage.test.jsx
npm run build
```

Expected:

- tests PASS
- Vite build PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SmartChatBox.css frontend/src/tests/SmartChatPage.test.jsx
git commit -m "style: make chat recommendation cards clearly interactive"
```

## Self-Review

- Spec coverage: The plan covers real-field-only recommendation behavior, full-card navigation to field detail, dead-link prevention, and frontend/backend verification. The only explicit non-goal preserved is the existing booking flow, which remains untouched and is reached through the existing detail page.
- Placeholder scan: No `TBD`, `TODO`, or vague "handle appropriately" steps remain. Each task includes explicit files, code, commands, and expected outcomes.
- Type consistency: The plan consistently uses `field_id`, `compact`, `/field/:id`, `recommendations`, and `RecommendedFieldCard` across backend and frontend tasks.

Plan complete and saved to `docs/superpowers/plans/2026-05-24-chatbox-real-field-links-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

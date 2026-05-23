# OpenRouter Hard Fail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove fake fallback chat answers and make the GraphRAG chat fail clearly when `OPENROUTER_API_KEY` is missing or OpenRouter recommendation generation fails.

**Architecture:** Tighten the OpenRouter client so recommendation generation and streaming raise explicit runtime errors instead of synthesizing fallback answers. Then update the FastAPI endpoints and tests so `/chat` and `/chat/stream` surface those failures honestly, and finish by checking whether the current runtime can actually read `OPENROUTER_API_KEY` without exposing its value.

**Tech Stack:** Python 3.10, FastAPI, httpx, pytest, Node/Express proxy, SSE streaming

---

## File Structure

- Modify: `graphrag-service/app/services/openrouter_client.py`
  Responsibility: Generate recommendation text and stream output from OpenRouter without fake fallback answers.

- Modify: `graphrag-service/app/main.py`
  Responsibility: Expose clear `/chat` and `/chat/stream` failure behavior when recommendation generation cannot run.

- Modify: `graphrag-service/app/tests/test_openrouter_client.py`
  Responsibility: Verify OpenRouter client behavior when API key is missing and when fallback text is no longer allowed.

- Modify: `graphrag-service/app/tests/test_app_smoke.py`
  Responsibility: Verify API-level behavior for `/chat` and `/chat/stream` under missing-key conditions.

- Modify: `backend/tests/aiChatRoute.test.js`
  Responsibility: Keep proxy-level tests aligned if backend-visible API behavior changes.

## Task 1: Remove Fake Recommendation Fallbacks From OpenRouter Client

**Files:**
- Modify: `graphrag-service/app/services/openrouter_client.py`
- Modify: `graphrag-service/app/tests/test_openrouter_client.py`

- [ ] **Step 1: Write the failing missing-key tests**

Replace the current fallback-oriented test in `graphrag-service/app/tests/test_openrouter_client.py` with tests that require explicit failure.

```python
import pytest

from app.services.openrouter_client import OpenRouterClient


def test_generate_recommendation_raises_when_api_key_is_missing():
    client = OpenRouterClient(api_key="", model="test-model")

    with pytest.raises(RuntimeError, match="OPENROUTER_API_KEY is not configured"):
        client.generate_recommendation(
            {
                "constraints": {},
                "candidate_fields": [
                    {
                        "field_id": 1,
                        "name": "San Bong Da",
                        "reasons": ["Gan khu vuc Quan 10"],
                    }
                ],
            }
        )


def test_stream_recommendation_raises_when_api_key_is_missing():
    client = OpenRouterClient(api_key="", model="test-model")

    with pytest.raises(RuntimeError, match="OPENROUTER_API_KEY is not configured"):
        list(
            client.stream_recommendation(
                {
                    "constraints": {},
                    "candidate_fields": [
                        {
                            "field_id": 1,
                            "name": "San Bong Da",
                            "reasons": ["Gan khu vuc Quan 10"],
                        }
                    ],
                }
            )
        )
```

- [ ] **Step 2: Run test to verify it fails**

Run: `C:\laragon6.0\bin\python\python-3.10\python.exe -m pytest graphrag-service/app/tests/test_openrouter_client.py -v`

Expected: FAIL because `generate_recommendation()` and `stream_recommendation()` currently fall back instead of raising.

- [ ] **Step 3: Remove fallback behavior and raise explicit recommendation errors**

Update `graphrag-service/app/services/openrouter_client.py` so recommendation paths no longer use `_fallback_response()` or `_fallback_stream()`.

```python
    def generate_recommendation(self, payload: dict) -> dict:
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

        prompt = self._build_prompt(payload)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "Ban la tro ly dat san chi duoc dua tren du lieu da truy xuat.",
                },
                {"role": "user", "content": prompt},
            ],
        }

        try:
            response = httpx.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=body,
                headers=headers,
                timeout=20.0,
            )
            response.raise_for_status()
            data = response.json()
            answer = self._sanitize_answer(data["choices"][0]["message"]["content"])
            return {
                "answer": answer,
                "recommendations": payload["candidate_fields"],
            }
        except Exception as error:
            raise RuntimeError("OpenRouter recommendation request failed") from error

    def stream_recommendation(self, payload: dict):
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not configured")

        prompt = self._build_prompt(payload)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "stream": True,
            "messages": [
                {
                    "role": "system",
                    "content": "Ban la tro ly dat san chi duoc dua tren du lieu da truy xuat.",
                },
                {"role": "user", "content": prompt},
            ],
        }

        try:
            with httpx.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                json=body,
                headers=headers,
                timeout=40.0,
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        break
                    token = self._extract_stream_token(data)
                    if token:
                        yield self._sanitize_stream_chunk(token)
        except Exception as error:
            raise RuntimeError("OpenRouter recommendation stream failed") from error
```

Also remove any `_fallback_response()` and `_fallback_stream()` helpers that become dead code after this change.

- [ ] **Step 4: Run tests to verify the client now hard-fails**

Run: `C:\laragon6.0\bin\python\python-3.10\python.exe -m pytest graphrag-service/app/tests/test_openrouter_client.py -v`

Expected: PASS, with no tests depending on fallback recommendation text.

- [ ] **Step 5: Commit**

```bash
git add graphrag-service/app/services/openrouter_client.py graphrag-service/app/tests/test_openrouter_client.py
git commit -m "refactor: hard fail when openrouter recommendations are unavailable"
```

## Task 2: Surface Honest API Errors For Chat And Chat Stream

**Files:**
- Modify: `graphrag-service/app/main.py`
- Modify: `graphrag-service/app/tests/test_app_smoke.py`

- [ ] **Step 1: Write the failing API smoke tests**

Add tests to `graphrag-service/app/tests/test_app_smoke.py` that prove missing-key recommendation generation does not silently return fake content.

```python
from fastapi.testclient import TestClient

from app.main import app


def test_chat_returns_failure_when_openrouter_key_is_missing(monkeypatch):
    monkeypatch.setattr("app.main.settings.openrouter_api_key", "")
    client = TestClient(app)

    response = client.post("/chat", json={"message": "san bong da quan 7"})

    assert response.status_code == 502
    assert "OPENROUTER_API_KEY" in response.json()["error"]


def test_chat_stream_emits_error_event_when_openrouter_key_is_missing(monkeypatch):
    monkeypatch.setattr("app.main.settings.openrouter_api_key", "")
    client = TestClient(app)

    response = client.post("/chat/stream", json={"message": "san bong da quan 7"})

    assert response.status_code == 200
    body = response.text
    assert "event: error" in body
    assert "OPENROUTER_API_KEY" in body
    assert "event: done" not in body
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `C:\laragon6.0\bin\python\python-3.10\python.exe -m pytest graphrag-service/app/tests/test_app_smoke.py -v`

Expected: FAIL because `/chat` currently swallows recommendation problems into generic responses and `/chat/stream` can still synthesize final content.

- [ ] **Step 3: Update FastAPI endpoints to pass through clear recommendation failures**

Update `graphrag-service/app/main.py` so `/chat` returns a clear 502 JSON error and `/chat/stream` emits an error event without a synthetic `done` payload.

```python
from fastapi import FastAPI, HTTPException

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    repository = GraphRepository(
        settings.neo4j_uri,
        settings.neo4j_username,
        settings.neo4j_password,
    )
    try:
        result = generate_chat_response(
            request=request,
            repository=repository,
            llm_client=OpenRouterClient(
                api_key=settings.openrouter_api_key,
                model=settings.openrouter_model,
            ),
        )
        return ChatResponse(**result)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error))
    finally:
        repository.close()


    def event_stream():
        yield _sse_event("meta", {"constraints": constraints.model_dump()})

        try:
            answer_parts = []
            for chunk in llm_client.stream_recommendation(payload):
                if not chunk:
                    continue
                answer_parts.append(chunk)
                yield _sse_event("token", {"content": chunk})

            answer = "".join(answer_parts).strip()
            yield _sse_event(
                "done",
                {
                    "answer": answer,
                    "recommendations": payload["candidate_fields"],
                    "constraints": constraints.model_dump(),
                },
            )
        except RuntimeError as error:
            yield _sse_event("error", {"message": str(error)})
```

Do not synthesize `answer = llm_client._fallback_response(payload)["answer"]` when no stream output exists.

- [ ] **Step 4: Run API smoke tests again**

Run: `C:\laragon6.0\bin\python\python-3.10\python.exe -m pytest graphrag-service/app/tests/test_app_smoke.py -v`

Expected: PASS, showing honest error behavior.

- [ ] **Step 5: Commit**

```bash
git add graphrag-service/app/main.py graphrag-service/app/tests/test_app_smoke.py
git commit -m "fix: surface explicit chat errors when openrouter is unavailable"
```

## Task 3: Keep Backend Proxy Expectations Aligned

**Files:**
- Modify: `backend/tests/aiChatRoute.test.js`

- [ ] **Step 1: Write the failing proxy-level test**

Add a backend-facing route test that captures the GraphRAG service failure message shape when upstream chat fails.

```js
test('POST /api/ai/chat forwards upstream recommendation failure as 502', async () => {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_AUTO_SYNC = 'true';
  const { createApp } = require('../app');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 502,
    body: null,
  });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'san bong da quan 7' }),
    });

    assert.equal(response.status, 502);
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});
```

- [ ] **Step 2: Run backend tests**

Run: `node --test backend/tests/aiChatRoute.test.js`

Expected: PASS if proxy behavior is already compatible, or FAIL if the route assumptions need updating.

- [ ] **Step 3: Adjust only if needed**

If the new test fails due to proxy expectations, update the test or route behavior minimally so Node continues to surface upstream 502s honestly without fabricating successful responses.

```js
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
```

- [ ] **Step 4: Re-run backend route tests**

Run: `node --test backend/tests/aiChatRoute.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/aiChatRoute.test.js
git commit -m "test: lock proxy behavior for upstream openrouter failures"
```

## Task 4: Verify Current Runtime Sees OPENROUTER_API_KEY

**Files:**
- Read only: `graphrag-service/.env`
- Read only: runtime environment available to the project

- [ ] **Step 1: Check `.env` presence without exposing the secret**

Run:

```powershell
Get-Content 'graphrag-service/.env' | Select-String -Pattern '^OPENROUTER_API_KEY='
```

Expected: one matching line if the key is configured in the file, but do not include the value in the final report.

- [ ] **Step 2: Check runtime settings resolution safely**

Run:

```powershell
@'
from app.config import settings
print("present" if bool(settings.openrouter_api_key) else "missing")
'@ | & 'C:\laragon6.0\bin\python\python-3.10\python.exe' -
```

Workdir: `graphrag-service`

Expected: `present` or `missing`

- [ ] **Step 3: Report only presence state**

In the final handoff, say whether the project currently reads `OPENROUTER_API_KEY` successfully. Do not print or summarize the key value itself.

## Self-Review

- Spec coverage: The plan covers client hard-fail behavior, API error propagation, and safe runtime verification of `OPENROUTER_API_KEY`. No fallback recommendation text remains in scope.
- Placeholder scan: No `TBD`, `TODO`, or vague references remain. Each step includes exact files, code, commands, and expected outcomes.
- Type consistency: The plan consistently uses `OPENROUTER_API_KEY`, `generate_recommendation`, `stream_recommendation`, `/chat`, `/chat/stream`, and clear runtime error propagation across all tasks.

Plan complete and saved to `docs/superpowers/plans/2026-05-24-openrouter-hard-fail-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

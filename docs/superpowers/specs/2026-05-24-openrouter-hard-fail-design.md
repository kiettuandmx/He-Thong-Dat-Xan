# OpenRouter Hard Fail Design

## Goal

Stop the chat system from producing fake fallback answers when OpenRouter is unavailable or `OPENROUTER_API_KEY` is missing, and surface a clear runtime error instead.

## Scope

This design covers:

- GraphRAG service behavior when OpenRouter credentials are missing
- GraphRAG service behavior when OpenRouter recommendation calls fail
- chat and chat-stream error propagation to the frontend
- verification that the current project can or cannot read `OPENROUTER_API_KEY`

This design does not cover:

- redesigning the frontend chat UI
- adding retry logic or queueing for OpenRouter failures
- changing the existing constraint extraction and scope classification flow beyond what is needed for explicit failures

## Current State

The current OpenRouter client falls back to `_fallback_response()` and `_fallback_stream()` when:

- `api_key` is missing
- OpenRouter completion calls fail

This makes the chat appear to work, but the answer can be template-driven and misleading.

## Recommended Approach

Use explicit hard-fail behavior for recommendation generation:

- if `OPENROUTER_API_KEY` is missing, raise a clear runtime error
- if OpenRouter recommendation generation fails, raise a clear runtime error
- `/chat` should return a clear failure response instead of fake answers
- `/chat/stream` should emit an `error` event and must not emit a fake `done` answer

This is the smallest change that makes the system honest and production-safe.

## Alternatives Considered

### 1. Hard fail with clear error

Recommended.

Pros:

- no fake AI output
- easy to reason about operationally
- makes configuration problems obvious

Cons:

- chat becomes unavailable until key/config is fixed

### 2. Fail only when key is missing, but keep fallback on transient network errors

Not recommended for this task.

Pros:

- slightly more resilient during provider instability

Cons:

- still risks non-transparent fake responses
- adds policy complexity

### 3. Return empty answers instead of error

Not recommended.

Pros:

- quiet UI behavior

Cons:

- hides the actual failure
- hard to debug

## Backend Design

`OpenRouterClient.generate_recommendation()` and `OpenRouterClient.stream_recommendation()` must no longer use `_fallback_response()` or `_fallback_stream()`.

Design rules:

- missing key should raise a clear error message such as `OPENROUTER_API_KEY is not configured`
- upstream request failures should raise a clear recommendation-generation error
- the stream path should stop with an error event, not synthetic answer content
- any fallback helper that only exists to produce fake recommendation text should be removed if it no longer serves a valid purpose

## API Behavior

For `POST /chat`:

- if OpenRouter recommendation generation cannot run, the endpoint should return a non-success response with a clear message

For `POST /chat/stream`:

- the endpoint may still emit `meta` if constraints were derived successfully
- if recommendation generation fails, it should emit an `error` event with a clear message
- it must not emit a fake `done` payload constructed from fallback text

## Configuration Verification

After the code change, verify whether the current runtime can read `OPENROUTER_API_KEY`.

Verification rules:

- report only whether the key is present or missing
- never print the secret value
- check the actual project/runtime configuration path rather than guessing

## Testing

Add or update tests for:

- recommendation generation raises when api key is missing
- stream recommendation raises or stops with error behavior when api key is missing
- API behavior no longer returns fake fallback text under missing-key conditions

## Risks

- if the environment has no valid key, chat will fail immediately after this change
- if existing tests depend on fallback behavior, they will need updating
- if frontend error messaging is too generic, users may still not understand the configuration problem

## Acceptance Criteria

- missing `OPENROUTER_API_KEY` no longer results in fallback recommendation text
- OpenRouter request failures no longer result in fallback recommendation text
- `/chat/stream` does not emit fake `done` content when recommendation generation fails
- project configuration is checked and reported as key-present or key-missing without exposing the secret value

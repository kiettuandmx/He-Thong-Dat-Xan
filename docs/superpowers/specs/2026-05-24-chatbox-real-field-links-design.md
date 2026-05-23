# Chatbox Real Field Links Design

## Goal

Make every recommended field shown inside the floating chatbox represent a real field from the live system, and let the user click the entire recommendation card to open that field's detail page and continue to booking.

## Scope

This design covers:

- chat recommendation cards rendered inside the frontend chatbox
- recommendation payload requirements returned by the GraphRAG service
- safe behavior when a recommendation does not have a real field identifier

This design does not cover:

- redesigning the field detail booking flow
- changing the overall chatbox visual direction beyond what is needed for clickable cards
- adding admin-only or owner-only booking shortcuts from chat

## Current State

The current chatbox renders recommendation cards through `RecommendedFieldCard` in compact mode. The card is presentational only and does not navigate anywhere.

The backend recommendation flow can return candidate fields from Neo4j, but the repository still contains a dev fallback path using `dev_candidates.json`. That means a recommendation can appear valid in the UI without guaranteeing that it is backed by a real field record in the live system.

## Recommended Approach

Use the existing `field_id` as the canonical navigation key, require recommendation cards in chat to be backed by a real field id, and render the entire compact card as a React Router `Link` to `/field/:id`.

This is the smallest change that:

- preserves the current chatbox structure
- matches the existing route structure for field detail pages
- gives users a direct path from recommendation to booking
- avoids introducing parallel "book now" flows inside the chat widget

## Alternatives Considered

### 1. Entire card as `Link` to field detail

Recommended.

Pros:

- best accessibility and browser behavior
- minimal frontend complexity
- aligned with the existing `FieldDetail` route

Cons:

- depends on recommendation data always containing a usable real `field_id`

### 2. Entire card as `onClick` navigate handler

Not recommended.

Pros:

- simple to wire

Cons:

- weaker accessibility than `Link`
- less natural behavior for keyboard and browser interactions

### 3. Add a separate button inside the card

Not recommended for this requirement.

Pros:

- explicit CTA

Cons:

- user asked for the whole card to be clickable
- adds more visual noise in a compact chat layout

## UX Design

When the assistant returns recommended fields:

- each compact recommendation card appears under the assistant message as it does today
- the full card surface is clickable
- hover and focus states make it obvious that the card is interactive
- clicking the card opens the field detail page for that exact field
- the user continues through the existing detail page flow to choose date, time slot, payment method, and confirm booking

If a recommendation item does not have a valid field id:

- it should not render as a clickable recommendation card
- the frontend should prefer not rendering that item rather than sending the user to a broken route

## Data Requirements

For chat recommendations to be considered production-ready, each recommended item must include:

- `field_id`
- `name`
- `reasons`
- any optional display fields already supported by the UI

The source of truth must be live repository data. Dev fallback candidates should not be treated as valid production recommendations for this flow.

## Backend Design

The GraphRAG repository and chat orchestration should guarantee that recommendation payloads used by the chat UI come from real field records.

Design rules:

- recommendation results must come from live repository data
- if the repository cannot return real field records, the service should fail transparently or return no recommendations rather than substituting dev-only field data
- clarification responses may still be returned when user intent is ambiguous, but any recommendation list attached to a final answer must use real field records

## Frontend Design

`RecommendedFieldCard` should support an interactive compact variant for chat usage.

Design rules:

- when `compact` is used with a valid `field_id`, render the root as a `Link`
- link destination should be `/field/${field_id}`
- the compact styling should remain visually consistent with the chatbox scale
- if `field_id` is missing, the compact card should fall back to a non-interactive container or be filtered out before render

## Error Handling

If live recommendations cannot be resolved:

- the assistant may still answer in text
- the recommendation card list should be empty rather than misleading
- the UI must avoid rendering dead links

## Testing

Add or update tests for:

- compact recommendation cards render as links when `field_id` is present
- clicking a recommended card navigates to the field detail route
- recommendation items without `field_id` do not render as broken clickable cards
- chat recommendation payloads still pass through existing stream rendering behavior

## Risks

- if dev fallback data remains active, the UI may still present non-production recommendations
- if some real records have missing or stale ids, navigation can silently break
- if the compact card becomes too dense, interaction clarity may drop on smaller chatbox sizes

## Acceptance Criteria

- recommended fields shown inside chat are backed by real field records
- the entire compact recommendation card is clickable
- clicking a recommendation opens the correct field detail page
- the user can continue into the existing booking flow from that page
- the chat UI does not expose dead recommendation links

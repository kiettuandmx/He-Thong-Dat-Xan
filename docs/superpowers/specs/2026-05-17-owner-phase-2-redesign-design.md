# Owner Phase 2 Redesign Design

Date: 2026-05-17
Project: He-Thong-Dat-Xan-develop
Scope: Owner experience redesign, phase 2
Status: Draft approved in conversation, awaiting user review of written spec

## 1. Goal

Redesign the owner-facing experience so it feels like a modern sports business command center while preserving the current business workflows and routes.

This phase focuses on the owner role only. The owner redesign should stay visually consistent with the new user-facing booking experience from phase 1, including the single-font rule and the updated color system.

## 2. Confirmed Direction

The owner redesign follows these confirmed decisions:

- Priority area: owner role first
- Priority screens: owner dashboard, revenue/payment history, owner reviews
- Visual personality: modern, polished, data-forward, and presentation-friendly
- Layout change level: strong layout refresh with existing business logic preserved
- Navigation scope: do not redesign the full owner navigation model yet
- Color strategy: keep the same brand system as the user experience for continuity
- Dashboard emphasis: balanced overview across revenue, booking workload, and service quality
- Typography rule: one font family only across the entire product
- Language rule: all owner-facing UI copy should be Vietnamese except unavoidable brand names or common technical terms

## 3. Recommended Approach

The chosen owner direction is `Command Center`.

Why this approach:

- It best matches the desire for a dashboard that looks impressive and data-driven.
- It supports both presentation and daily operations.
- It works well with the existing analytics and booking data already exposed to `OwnerDashboard`.
- It creates a clear template for later admin redesign without copying the user browsing layout.

Approaches considered but not chosen:

- `Analytics Studio`: very strong on charts, but can feel too report-heavy for routine owner work.
- `Operations Hybrid`: practical and safe, but less visually memorable than the chosen direction.

## 4. Design Principles

- Preserve current owner workflows and routes while significantly upgrading presentation.
- Make the dashboard feel like the center of business awareness, not just a list of cards and tables.
- Use data hierarchy intentionally: large KPIs first, trends second, actionable detail third.
- Keep visual alignment with the user-facing redesign so the product still feels like one system.
- Use the same font family, component language, spacing rhythm, and tone of Vietnamese copy.
- Prefer fewer, stronger panels over many small competing widgets.
- Improve clarity and scannability before adding decorative complexity.

## 5. In-Scope Screens

### 5.1 Core owner screens for phase 2

- `frontend/src/pages/OwnerDashboard.jsx`
- `frontend/src/pages/PaymentHistory.jsx` when role is owner
- `frontend/src/pages/OwnerReviews.jsx`

### 5.2 Supporting files in scope

- `frontend/src/components/MainLayout.jsx` for owner entry polish only
- `frontend/src/App.css`
- `frontend/src/index.css`

### 5.3 Out of scope for this phase

- Full owner information architecture rewrite
- Owner field management redesign
- Owner schedule page redesign
- Admin redesign
- Backend business rule changes unrelated to display and input support

## 6. Owner Experience Structure

The owner experience should feel like a workspace distinct from the user browsing flow, while remaining in the same brand family.

The overall owner structure for this phase:

1. Owner shell entry remains in the existing app structure
2. Dashboard becomes the main command center
3. Revenue/payment history becomes an analytics surface rather than just a log table
4. Reviews become a quality-management screen rather than a raw list

The owner area should feel operational and premium, but not dark, corporate, or visually disconnected from the public-facing product.

## 7. Screen Design

### 7.1 Owner dashboard

`OwnerDashboard` is the flagship screen of this phase.

#### Primary goals

- Give owners an immediate sense of current business health
- Balance financial, operational, and quality signals
- Surface recent bookings and attention areas without overwhelming the page

#### Proposed structure

- Analytics hero band with the strongest top-line signals
- Large KPI cards for:
  - monthly revenue
  - today’s bookings
  - most-used field
  - peak booking hour
- Main chart area with stronger visual hierarchy
- Secondary operational area for recent bookings and items needing action
- Service quality snapshot for ratings/review health

#### Behavioral constraints

- Keep existing data fetching flow intact unless restructuring is needed for display
- Reuse existing analytics API where possible
- Preserve existing booking approval logic if already wired

### 7.2 Owner payment history

`PaymentHistory` for owners should become a financial analysis page rather than a plain transaction history view.

#### Primary goals

- Help owners understand income, refunds, and real revenue quickly
- Make date filtering more intentional and readable
- Keep detailed transaction rows available below the summary layer

#### Proposed structure

- Summary hero/header
- Three strong financial summary panels:
  - total payments
  - total refunds
  - net revenue
- Clear filter bar for month/custom range mode
- Cleaner transaction table with better status and amount emphasis
- Progressive loading or “load more” remains acceptable if already implemented

### 7.3 Owner reviews

`OwnerReviews` should become a proper service quality management screen.

#### Primary goals

- Make it easy to scan feedback quality at a glance
- Encourage owners to respond to reviews quickly
- Improve clarity of review author, field context, rating, and reply status

#### Proposed structure

- Summary header with review context
- Review list in consistent cards
- Each review card should show:
  - field/stadium context
  - rating
  - customer comment
  - created date
  - owner reply status
  - reply action area

Reply UX may remain inline if that is the simplest path, but it must be visually cleaner and easier to understand than the current implementation.

## 8. Visual System for Owner

### 8.1 Shared foundation with user redesign

Owner must reuse the same:

- font family
- core color tokens
- surface styling
- border radius language
- spacing rhythm
- overall Vietnamese tone

### 8.2 Owner-specific expression

Within that shared system, owner should feel more operational:

- denser but still breathable layout
- more structured panel headers
- stronger visual hierarchy for numbers
- cleaner data table styling
- more deliberate chart colors and meanings

### 8.3 Component types introduced or emphasized

Phase 2 owner should define styling patterns for:

- analytics hero
- KPI card
- chart panel
- financial summary card
- owner data table
- review card
- inline reply area
- empty/error/loading panels

### 8.4 Chart styling

Charts should not use arbitrary colors.

Rules:

- use a stable semantic palette
- keep high-importance metrics visually prominent
- reduce chart clutter
- ensure legends, labels, and tooltips remain readable in Vietnamese

## 9. Content and Copy Rules

- All owner-facing UI copy should be Vietnamese by default
- Remove broken accents and mixed-language phrasing where touched
- Align labels across dashboard, reviews, and finance pages so concepts are named consistently
- Avoid casual or messy placeholder wording in operational surfaces

Examples of content to standardize:

- KPI labels
- chart titles
- filter labels
- empty-state text
- action labels
- transaction statuses
- review response prompts

## 10. System States

The owner phase must standardize:

- loading
- empty
- error
- disabled

Requirements:

- dashboard loading should feel like panels are preparing, not like a blank page
- empty review and payment states should explain what is missing in plain Vietnamese
- error states should be readable and product-like, not technical
- “no data in date range” should differ from “system failed to load”

## 11. Responsive Rules

Owner is desktop-first for this phase.

### Desktop

- Priority experience
- Full analytics composition
- Strong side-by-side panel usage

### Tablet

- Maintain usable charts and cards
- Collapse some multi-column layouts
- Keep filters and actions accessible

### Mobile

- Still functional, but not the visual priority
- KPI cards stack vertically
- Tables may simplify or scroll horizontally
- Reply actions and filters must remain usable

## 12. File-Level Scope

Expected phase 2 implementation focus:

- `frontend/src/pages/OwnerDashboard.jsx`
- `frontend/src/pages/OwnerReviews.jsx`
- `frontend/src/pages/PaymentHistory.jsx`
- `frontend/src/components/MainLayout.jsx`
- `frontend/src/App.css`
- `frontend/src/index.css`

Potential helper additions are acceptable if they improve separation and reuse, but avoid unnecessary architectural churn.

## 13. Risks and Constraints

- Current owner pages mix Bootstrap-like structure with ad hoc styling and inconsistent text quality.
- `OwnerDashboard.jsx` currently appears to reference approval behavior without clearly defining it in the file, so implementation must verify action wiring before relying on it.
- `OwnerReviews.jsx` is especially rough and may need a bigger UI rewrite than the other owner pages.
- `PaymentHistory.jsx` already serves both owner and user roles, so redesign must preserve role-sensitive behavior while improving owner presentation.

## 14. Success Criteria

This owner redesign is successful if:

- the owner area feels like a polished operational workspace
- dashboard information hierarchy is immediately understandable
- revenue and review pages feel purpose-built, not generic tables/lists
- owner screens remain visually aligned with the user redesign
- all touched owner copy is consistently Vietnamese
- functionality and routes remain intact while presentation improves significantly

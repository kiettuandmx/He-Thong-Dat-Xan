# Green Theme System Design

Date: 2026-05-19
Project: He-Thong-Dat-Xan-develop
Scope: Full frontend accent-theme replacement from orange to green
Status: Draft approved in conversation, awaiting user review of written spec

## 1. Goal

Replace the current orange-led visual identity across the entire frontend with a natural, sports-oriented green theme.

This task changes the brand accent layer only. It does not redesign layout, rewrite flows, or alter feature behavior.

The new theme should feel:

- tu nhien
- the thao
- sang
- than thien
- thong nhat giua user, owner, va admin

## 2. Confirmed Direction

The theme task follows these confirmed decisions:

- Apply to the entire frontend, not just one role area
- Replace orange wherever it acts as a primary accent
- Keep layouts, spacing, typography, and logic unchanged
- Audit both shared design tokens and hard-coded color usage
- Replace accent-related gradients, shadows, glow, and highlight states, not just solid fills
- The new green should be natural and sports-friendly, not neon and not enterprise-heavy

## 3. Recommended Approach

The chosen direction is `Full frontend accent migration with token-first replacement`.

Why this approach:

- It creates a single consistent brand palette across user, owner, and admin.
- It avoids leaving behind orange fragments in hover states, hero glows, or older hard-coded rules.
- It is safer than page-by-page restyling because the shared token layer can absorb most of the change cleanly.

Approaches considered but not chosen:

- `Accent-only swap in a few obvious buttons`: too shallow and likely to leave visual inconsistency
- `Full redesign while changing the color`: too much scope and not needed for this task

## 4. Scope

### 4.1 In scope

- shared accent tokens
- active states
- primary CTA states
- badge highlights
- icon accents
- accent-tinted panel backgrounds
- accent-tinted gradients
- accent-tinted shadows and glow
- user pages
- owner pages
- admin pages
- auth pages if they still contain orange-led brand emphasis

### 4.2 Out of scope

- layout redesign
- component restructuring
- route changes
- API changes
- business logic changes
- typography changes unrelated to color

## 5. Theme Objective

This task is not “make everything green.”

It is:

- preserve the current bright visual system
- preserve the current information architecture
- replace the orange brand/accent family with a balanced green family

The site should still look like the same product, but with a new color identity.

## 6. New Color System

### 6.1 Primary accent

Recommended primary accent:

- `#2f8f4e`

This is the main green used for:

- primary buttons
- active nav states
- selected chips
- accent text links when emphasized
- action highlights

### 6.2 Strong accent

Recommended stronger state:

- `#237242`

This is used for:

- hover states
- active states
- pressed CTA states
- stronger emphasis on important green actions

### 6.3 Soft accent

Recommended soft surface:

- `#e8f5ec`

This is used for:

- selected backgrounds
- active pills
- soft badges
- highlight panels
- subtle emphasis areas

### 6.4 Accent wash

Recommended transparent accent wash:

- `rgba(47, 143, 78, 0.12)`

This is used for:

- radial glow
- hero background wash
- soft decorative gradients
- subtle colored shadows where needed

### 6.5 Neutral colors

These should stay broadly aligned with the current system:

- light page background
- white surfaces
- dark text
- soft borders
- soft shadows

The task is specifically an accent migration, not a full neutral palette rewrite.

## 7. Usage Rules

### 7.1 What should turn green

Replace orange-led emphasis in:

- primary buttons
- selected tabs or pills
- active navigation states
- CTA panels
- accent icons
- positive-highlight callouts where orange currently acts as the brand color
- headline accent fragments

### 7.2 What should not become green by default

Do not automatically change:

- neutral text
- grayscale borders
- danger/error red
- warning amber unless they were incorrectly using the orange brand accent
- success green states that already represent system status rather than brand identity

### 7.3 State mapping

Recommended mapping:

- default accent -> `#2f8f4e`
- hover/active accent -> `#237242`
- selected background -> `#e8f5ec`
- glow/wash -> `rgba(47, 143, 78, 0.12)`

## 8. File Impact

### 8.1 Primary files

Most likely affected first:

- `frontend/src/App.css`
- `frontend/src/index.css`

### 8.2 Secondary files

Files may also need touch-ups where hard-coded accent colors remain inside components or pages, especially in:

- user-facing listing/detail pages
- owner dashboard and owner panels
- admin layout and admin dashboard
- login/register/auth pages

### 8.3 Color patterns to audit

The implementation must search and replace:

- orange token variables
- hard-coded orange hex values
- rgba values derived from orange
- radial or linear gradients with orange stops
- box shadows with orange tint
- border highlights with orange tint

## 9. Component Areas Most Likely Affected

Expected impact zones:

- primary and secondary action buttons
- account pages
- field cards
- detail booking CTA surfaces
- owner KPI cards and overview accents
- admin quick actions and active states
- auth entry panels
- badges and chips
- decorative hero treatments

## 10. Success Criteria

The task is successful when:

- the frontend no longer presents orange as the main brand accent
- user, owner, and admin share the same green-led accent family
- CTA, active states, badge emphasis, glow, and gradient treatments all reflect the new green palette
- the interface still feels bright, sporty, and natural
- no layout or logic regressions are introduced by the color migration

## 11. Risks and Constraints

- Hard-coded legacy accent values may exist outside the token layer and require manual cleanup
- Some current green tones may already represent success/system states and should not be blindly merged with the new brand green
- A token-first change alone may not be sufficient if older pages use direct hex values or bespoke gradients

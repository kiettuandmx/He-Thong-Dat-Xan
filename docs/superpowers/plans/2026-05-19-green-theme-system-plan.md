# Green Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the orange-led accent system across the full frontend with a natural green accent system while preserving the current layouts, components, routes, and feature behavior.

**Architecture:** The migration should be token-first. Update shared color variables in `frontend/src/index.css`, then sweep `frontend/src/App.css` and any component/page files that still hard-code orange hex, rgba, gradients, or glow values. Verification should focus on both code-level token assertions and broad frontend regression tests so the app stays visually consistent across user, owner, and admin surfaces.

**Tech Stack:** React 19, React Router 7, Vite 8, CSS variables, App-wide CSS in `App.css` and `index.css`, Vitest, React Testing Library

---

## File Structure

**Files and responsibilities:**

- Modify: `frontend/src/index.css`
  Responsibility: replace the shared accent token family from orange to green and update any root-level background wash tied to the old orange identity.
- Modify: `frontend/src/App.css`
  Responsibility: replace orange-derived gradients, shadows, glow, borders, and hard-coded accents across shared user, owner, and admin styles.
- Modify: `frontend/src/pages/OwnerDashboard.jsx`
  Responsibility: replace chart color constants that still hard-code orange-led palette entries.
- Modify: `frontend/src/pages/Register.jsx`
  Responsibility: fix any page-level inline accent color usage that bypasses shared tokens.
- Create: `frontend/src/test/theme-colors.test.jsx`
  Responsibility: assert the shared accent CSS variables now resolve to the approved green palette.
- Modify: `frontend/src/test/app-shell.test.jsx`
  Responsibility: keep shell-level regression coverage stable if any color-token assertions are added nearby.

This task intentionally does **not** redesign layouts or introduce new components.

### Task 1: Lock the new green palette with a token-level test

**Files:**
- Create: `frontend/src/test/theme-colors.test.jsx`

- [ ] **Step 1: Write a failing test that checks the root accent variables now use the approved green palette**

```jsx
import { describe, expect, it } from 'vitest';

describe('Green theme tokens', () => {
  it('exposes the approved green accent palette at root level', () => {
    const styles = getComputedStyle(document.documentElement);

    expect(styles.getPropertyValue('--color-accent').trim()).toBe('#2f8f4e');
    expect(styles.getPropertyValue('--color-accent-strong').trim()).toBe('#237242');
    expect(styles.getPropertyValue('--color-accent-soft').trim()).toBe('rgba(47, 143, 78, 0.12)');
  });
});
```

- [ ] **Step 2: Run the theme token test to confirm it fails against the current orange theme**

Run: `npm test -- src/test/theme-colors.test.jsx`

Expected: FAIL because `--color-accent` and related variables still point to orange values.

- [ ] **Step 3: Commit the failing token test**

```bash
git add frontend/src/test/theme-colors.test.jsx
git commit -m "test: lock green theme token expectations"
```

### Task 2: Replace the shared accent tokens in `index.css`

**Files:**
- Modify: `frontend/src/index.css`
- Test: `frontend/src/test/theme-colors.test.jsx`

- [ ] **Step 1: Replace the root accent variables with the approved green palette**

```css
:root {
  --color-accent: #2f8f4e;
  --color-accent-strong: #237242;
  --color-accent-soft: rgba(47, 143, 78, 0.12);
  --color-success: #1f9d55;
  --color-success-soft: rgba(31, 157, 85, 0.12);
}
```

- [ ] **Step 2: Update the root page background wash so it no longer carries orange tint**

```css
body {
  background:
    radial-gradient(circle at top, #f2fbf5 0%, #f4f7fb 45%, #eef3f8 100%);
}
```

- [ ] **Step 3: Run the token test again**

Run: `npm test -- src/test/theme-colors.test.jsx`

Expected: PASS.

- [ ] **Step 4: Commit the token migration**

```bash
git add frontend/src/index.css frontend/src/test/theme-colors.test.jsx
git commit -m "style: switch shared accent tokens to green"
```

### Task 3: Sweep shared orange gradients, glows, and hard-coded accents in `App.css`

**Files:**
- Modify: `frontend/src/App.css`
- Test: `frontend/src/test/theme-colors.test.jsx`

- [ ] **Step 1: Replace hard-coded orange shadow tints with green-derived values**

```css
.brand-mark__badge,
.primary-button,
.owner-summary-card__icon,
.admin-brand__badge {
  box-shadow: 0 14px 28px rgba(35, 114, 66, 0.22);
}
```

- [ ] **Step 2: Replace orange-tinted fills and borders used for soft emphasis**

```css
.main-nav__link.is-active,
.field-card__badge,
.payment-option.is-active,
.admin-nav-panel__item.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
  border-color: rgba(35, 114, 66, 0.22);
}
```

- [ ] **Step 3: Replace orange-led gradients and radial glows with green equivalents**

```css
.listing-hero,
.detail-hero,
.owner-shell-header,
.admin-dashboard-hero {
  background:
    radial-gradient(circle at top left, rgba(47, 143, 78, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 253, 0.98));
}

.detail-hero::before,
.owner-hero-panel,
.auth-visual-panel {
  background:
    linear-gradient(135deg, rgba(12, 18, 29, 0.88), rgba(47, 143, 78, 0.35));
}
```

- [ ] **Step 4: Search for any remaining orange literals and replace them intentionally**

Run: `rg -n "ff6b2c|f04e23|255, 107, 44|240, 78, 35|ff8a4c" frontend/src/App.css`

Expected: either no matches, or only matches that are actively being replaced in this task.

- [ ] **Step 5: Run the token test after the sweep**

Run: `npm test -- src/test/theme-colors.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit the shared CSS sweep**

```bash
git add frontend/src/App.css
git commit -m "style: replace shared orange accents with green"
```

### Task 4: Clean up page-level color escapes outside the shared CSS token layer

**Files:**
- Modify: `frontend/src/pages/OwnerDashboard.jsx`
- Modify: `frontend/src/pages/Register.jsx`
- Test: `frontend/src/test/app-shell.test.jsx`

- [ ] **Step 1: Replace the owner dashboard chart palette so the strongest accent begins from green rather than orange**

```jsx
const CHART_COLORS = ['#2f8f4e', '#66a97d', '#1f9d55', '#3156c9', '#ffb020'];
```

- [ ] **Step 2: Replace any inline accent usage that bypasses shared tokens**

```jsx
<div
  className="mb-3 d-inline-block p-3 rounded-circle"
  style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-strong)' }}
>
```

- [ ] **Step 3: Search for remaining orange literals across pages and components**

Run: `rg -n "ff6b2c|f04e23|255, 107, 44|240, 78, 35|ff8a4c" frontend/src/pages frontend/src/components`

Expected: no remaining orange accent literals in active frontend source, or only values that are not part of the brand accent system.

- [ ] **Step 4: Run shell-level regression tests**

Run: `npm test -- src/test/app-shell.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit page-level cleanup**

```bash
git add frontend/src/pages/OwnerDashboard.jsx frontend/src/pages/Register.jsx frontend/src/test/app-shell.test.jsx
git commit -m "style: align page-level accents to green theme"
```

### Task 5: Run broad frontend verification for the green theme migration

**Files:**
- Modify: any touched frontend file only if verification finds missed orange accents or regressions

- [ ] **Step 1: Run the focused frontend regression slice**

Run: `npm test -- src/test/theme-colors.test.jsx src/test/app-shell.test.jsx src/test/field-detail.test.jsx src/test/wallet-page.test.jsx`

Expected: PASS.

- [ ] **Step 2: Search the full frontend source for leftover primary orange values**

Run: `rg -n "ff6b2c|f04e23|255, 107, 44|240, 78, 35|ff8a4c" frontend/src -g '!frontend/dist/**'`

Expected: no remaining matches that function as the old brand accent.

- [ ] **Step 3: Run a production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit any final cleanup fixes**

```bash
git add frontend/src/index.css frontend/src/App.css frontend/src/pages/OwnerDashboard.jsx frontend/src/pages/Register.jsx frontend/src/test/theme-colors.test.jsx
git commit -m "style: complete full green theme migration"
```

## Self-Review

Spec coverage check:

- full frontend accent migration: covered in Tasks 2 through 5
- green token family: covered in Tasks 1 and 2
- hard-coded orange cleanup: covered in Tasks 3 and 4
- user, owner, and admin consistency: covered in Task 3 and broad verification in Task 5
- no layout or logic changes: preserved by scoping all work to CSS, constants, and existing UI tokens

Placeholder scan:

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every task includes exact files, commands, and concrete replacement examples.

Type consistency check:

- The plan consistently uses `--color-accent`, `--color-accent-strong`, and `--color-accent-soft` as the shared token names.
- The same approved palette values are referenced throughout the plan.

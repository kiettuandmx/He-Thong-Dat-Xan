# Admin UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Điều chỉnh `AdminLayout` và `AdminDashboard` để dùng cùng visual language với user/owner, nhưng vẫn giữ cấu trúc điều hướng và bố cục admin hiện có.

**Architecture:** Phase này không đổi structure admin nữa. `AdminLayout` vẫn là `topbar + dropdown`, `AdminDashboard` vẫn là `hero ngắn + KPI + quick actions + broadcast panel`; thay đổi nằm ở palette, card treatment, button treatment, radius, shadow và spacing để đồng bộ với phần user/owner trong `App.css`.

**Tech Stack:** React 19, React Router 7, Vite 8, Bootstrap utilities, Axios, React Toastify, Vitest, React Testing Library

---

## File Structure

**Files and responsibilities:**

- Modify: `frontend/src/pages/AdminLayout.jsx`
  Responsibility: keep the current admin shell structure, only refine copy or class names if needed to support the shared visual system.
- Modify: `frontend/src/pages/AdminDashboard.jsx`
  Responsibility: keep the current dashboard information architecture, only refine copy or class names if needed to support the shared visual system.
- Modify: `frontend/src/App.css`
  Responsibility: replace enterprise-leaning admin visuals with tokens/patterns aligned to user/owner surfaces, buttons, shadows, radius, and spacing.
- Modify: `frontend/src/test/admin-layout.test.jsx`
  Responsibility: keep layout behavior coverage stable if any text or accessible names need tiny alignment updates.
- Modify: `frontend/src/test/admin-dashboard.test.jsx`
  Responsibility: keep dashboard behavior coverage stable if any text or accessible names need tiny alignment updates.

This plan intentionally does **not** expand to other admin pages.

### Task 1: Lock the updated visual intent with targeted tests

**Files:**
- Modify: `frontend/src/test/admin-layout.test.jsx`
- Modify: `frontend/src/test/admin-dashboard.test.jsx`

- [ ] **Step 1: Update `AdminLayout` test wording only if the refined shared-language copy changes accessible text**

```jsx
it('shows grouped admin navigation in Vietnamese', () => {
  mockUseAuth.mockReturnValue({
    user: { user: { full_name: 'Nguyen Admin' } },
    logout: vi.fn(),
  });

  render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <AdminLayout />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /tong quan/i }));

  expect(screen.getByRole('link', { name: /quan ly tai khoan/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /xu ly khieu nai/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Update `AdminDashboard` test wording only if the CTA or card labels change slightly**

```jsx
it('renders the dashboard hero, KPI cards and quick actions in Vietnamese', async () => {
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );

  expect(
    await screen.findByRole('heading', { name: /ban dieu phoi trung tam/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/tai khoan/i)).toBeInTheDocument();
  expect(screen.getByText(/cho duyet/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /quan ly tai khoan/i })).toBeInTheDocument();
});
```

- [ ] **Step 3: Run the targeted tests before changing code**

Run: `npm test -- src/test/admin-layout.test.jsx src/test/admin-dashboard.test.jsx`

Expected: PASS on the current implementation, proving the next work is visual refactoring rather than structural change.

- [ ] **Step 4: Commit test adjustments only if any were needed**

```bash
git add frontend/src/test/admin-layout.test.jsx frontend/src/test/admin-dashboard.test.jsx
git commit -m "test: align admin ui assertions with shared visual direction"
```

### Task 2: Restyle `AdminLayout` to match the user/owner shell system

**Files:**
- Modify: `frontend/src/pages/AdminLayout.jsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/src/test/admin-layout.test.jsx`

- [ ] **Step 1: Keep `AdminLayout` structure intact and only refine any copy/classes that still feel enterprise-specific**

```jsx
<header className="admin-topbar">
  <div className="admin-topbar__inner">
    <Link className="admin-brand" to="/admin/dashboard">
      <span className="admin-brand__badge">
        <i className="bi bi-shield-check" />
      </span>
      <span className="admin-brand__copy">
        <strong>He thong Admin</strong>
        <small>Dieu phoi va kiem soat van hanh</small>
      </span>
    </Link>

    <div className="admin-nav-switcher">{/* keep existing trigger + grouped panel */}</div>

    <div className="admin-topbar__actions">{/* keep account trigger + logout */}</div>
  </div>
</header>
```

- [ ] **Step 2: Rework topbar, dropdown, and drawer styling in `App.css` to reuse the same visual family as user/owner**

```css
.admin-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top, #fff7f2 0%, #f4f7fb 42%, #eef3f8 100%);
}

.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 1200;
  backdrop-filter: blur(18px);
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid var(--color-border);
}

.admin-nav-switcher__trigger,
.admin-account-trigger {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}

.admin-nav-panel,
.admin-account-drawer,
.admin-account-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 3: Align active, hover, and emphasis states with the site-wide accent orange**

```css
.admin-nav-panel__item:hover,
.admin-nav-panel__item.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.admin-brand__badge,
.admin-account-trigger__avatar,
.admin-account-card__avatar {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
  color: #fff;
  box-shadow: 0 14px 28px rgba(240, 78, 35, 0.22);
}
```

- [ ] **Step 4: Restyle drawer action rows to match account pages instead of bespoke admin tones**

```css
.admin-account-link {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.admin-account-link:hover {
  background: #fff1eb;
}

.admin-account-logout {
  background: #fff4f1;
  color: var(--color-accent-strong);
}
```

- [ ] **Step 5: Run the layout test suite**

Run: `npm test -- src/test/admin-layout.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit the shared-system admin shell styling**

```bash
git add frontend/src/pages/AdminLayout.jsx frontend/src/App.css frontend/src/test/admin-layout.test.jsx
git commit -m "style: align admin layout with shared frontend system"
```

### Task 3: Restyle `AdminDashboard` to feel like an owner workspace variant

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/src/test/admin-dashboard.test.jsx`

- [ ] **Step 1: Keep the dashboard structure but soften any copy that still feels like a separate control center product**

```jsx
<section className="admin-dashboard-hero">
  <div className="admin-dashboard-hero__copy">
    <p className="admin-dashboard-eyebrow">Dieu hanh</p>
    <h1>Ban dieu phoi trung tam cho toan bo he thong dat san.</h1>
    <p>
      Theo doi nhanh tinh hinh van hanh va di thang vao cac luong quan tri quan trong
      nhat trong ngay.
    </p>
  </div>
</section>
```

- [ ] **Step 2: Replace dark or teal-leaning dashboard surfaces with owner-style bright panels**

```css
.admin-dashboard-hero,
.admin-kpi-card,
.admin-dashboard-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.admin-dashboard-hero {
  background:
    radial-gradient(circle at top left, rgba(255, 107, 44, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 253, 0.98));
}
```

- [ ] **Step 3: Make KPI cards match the owner/user card family**

```css
.admin-kpi-card__icon {
  border-radius: var(--radius-md);
}

.admin-kpi-card--green .admin-kpi-card__icon {
  background: #fff1eb;
  color: var(--color-accent-strong);
}

.admin-kpi-card--teal .admin-kpi-card__icon,
.admin-kpi-card--blue .admin-kpi-card__icon,
.admin-kpi-card--gold .admin-kpi-card__icon {
  background: var(--color-surface-muted);
  color: var(--color-text);
}
```

- [ ] **Step 4: Restyle hero buttons and quick action cards to use the same primary/secondary language as the rest of the site**

```css
.admin-dashboard-primary-action,
.admin-broadcast-form button {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
  color: #fff;
  box-shadow: 0 14px 28px rgba(240, 78, 35, 0.22);
}

.admin-dashboard-secondary-action {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.admin-quick-action-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 5: Remove the bespoke dark broadcast panel treatment and use the same panel system**

```css
.admin-dashboard-panel--secondary {
  background: var(--color-surface);
}

.admin-broadcast-form textarea {
  background: var(--color-surface-muted);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

- [ ] **Step 6: Run the dashboard test suite**

Run: `npm test -- src/test/admin-dashboard.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit the shared-system dashboard styling**

```bash
git add frontend/src/pages/AdminDashboard.jsx frontend/src/App.css frontend/src/test/admin-dashboard.test.jsx
git commit -m "style: align admin dashboard with shared frontend system"
```

### Task 4: Final regression pass for the shared-system admin redesign

**Files:**
- Modify: `frontend/src/pages/AdminLayout.jsx`
- Modify: `frontend/src/pages/AdminDashboard.jsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/src/test/admin-layout.test.jsx`
- Test: `frontend/src/test/admin-dashboard.test.jsx`

- [ ] **Step 1: Scan for leftover enterprise-specific admin styling and remove it**

```css
/* Remove or replace any remaining deep teal gradients, bespoke dark surfaces,
   or admin-only shadow/radius systems that diverge from the user/owner styles. */
```

- [ ] **Step 2: Run the targeted admin tests**

Run: `npm test -- src/test/admin-layout.test.jsx src/test/admin-dashboard.test.jsx`

Expected: PASS.

- [ ] **Step 3: Run the broader regression set**

Run: `npm test -- src/test/app-shell.test.jsx src/test/admin-layout.test.jsx src/test/admin-dashboard.test.jsx`

Expected: PASS.

- [ ] **Step 4: Run lint for the frontend package**

Run: `npm.cmd run lint`

Expected: PASS, or only existing repo warnings unrelated to this redesign direction.

- [ ] **Step 5: Run a production build**

Run: `npm run build`

Expected: `vite build` completes successfully.

- [ ] **Step 6: Manual verification in the browser**

Run: `npm.cmd run dev -- --host 127.0.0.1`

Expected: local app opens for checking these breakpoints:
- mobile `390x844`
- tablet `768x1024`
- desktop `1440x900`

Confirm:
- admin topbar looks like the same product family as user/owner
- dropdown panel uses the orange active state and soft card treatment
- account drawer feels aligned with the user/owner account shell
- dashboard hero looks like an owner-workspace variant, not a separate dark product
- KPI cards and quick actions feel consistent with shared surfaces, spacing, and buttons
- broadcast panel no longer breaks the visual language

- [ ] **Step 7: Commit the finalized shared-system admin redesign**

```bash
git add frontend/src/pages/AdminLayout.jsx frontend/src/pages/AdminDashboard.jsx frontend/src/App.css frontend/src/test/admin-layout.test.jsx frontend/src/test/admin-dashboard.test.jsx
git commit -m "style: unify admin ui with shared frontend system"
```

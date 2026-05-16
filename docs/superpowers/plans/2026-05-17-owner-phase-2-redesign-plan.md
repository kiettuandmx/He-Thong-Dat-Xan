# Owner Phase 2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mới khu owner theo phong cách command center hiện đại, đồng bộ với phase 1 của user, tập trung vào `OwnerDashboard`, `PaymentHistory` vai trò owner và `OwnerReviews` mà không đổi nghiệp vụ hiện có.

**Architecture:** Kế hoạch này giữ nguyên route, API và logic nghiệp vụ chính, nhưng nâng lớp trình bày của owner thành một workspace điều hành có KPI, chart panel, table panel và review panel dùng chung token CSS với phase 1. Việc triển khai đi từ nền test và helper dữ liệu owner, sang shell/layout owner, rồi mới làm dashboard, tài chính và review để giảm rủi ro gãy flow.

**Tech Stack:** React 19, Vite 8, React Router 7, Recharts, Axios, Bootstrap utilities, Vitest, React Testing Library, ESLint

---

### Task 1: Khóa baseline test và helper dữ liệu cho owner phase 2

**Files:**
- Modify: `frontend/src/test/setup.js`
- Create: `frontend/src/test/owner-dashboard.test.jsx`
- Create: `frontend/src/test/owner-payment-history.test.jsx`
- Create: `frontend/src/test/owner-reviews.test.jsx`
- Create: `frontend/src/utils/ownerMetricsHelpers.js`

- [ ] **Step 1: Viết test thất bại cho dashboard owner**

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OwnerDashboard from '../pages/OwnerDashboard';

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: {
          todayBookings: 4,
          monthlyRevenue: 3200000,
          fieldUsage: [],
          peakTimes: [],
          summary: {
            topField: 'Sân A',
            peakHour: '18:00 - 19:00',
          },
        },
      }),
  },
}));

it('renders owner dashboard headline and KPI labels in Vietnamese', async () => {
  render(<OwnerDashboard />);

  expect(await screen.findByRole('heading', { name: /bảng điều khiển chủ sân/i })).toBeInTheDocument();
  expect(screen.getByText(/doanh thu tháng này/i)).toBeInTheDocument();
  expect(screen.getByText(/đơn hôm nay/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test để xác nhận đang fail**

Run: `npm.cmd test -- src/test/owner-dashboard.test.jsx`

Expected: FAIL vì `OwnerDashboard` hiện chưa có đúng headline hoặc cấu trúc được kiểm thử.

- [ ] **Step 3: Tạo helper chuẩn hóa số liệu owner dùng chung**

```js
export const formatOwnerCurrency = (value) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export const normalizeOwnerSummary = (raw = {}) => ({
  topField: raw.topField || 'Chưa có dữ liệu',
  peakHour: raw.peakHour || 'Chưa có dữ liệu',
  monthlyRevenue: Number(raw.monthlyRevenue || 0),
  todayBookings: Number(raw.todayBookings || 0),
});
```

- [ ] **Step 4: Thêm test baseline cho `PaymentHistory` vai trò owner**

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PaymentHistory from '../pages/PaymentHistory';

vi.mock('../services/paymentHistoryService', () => ({
  buildCurrentMonthDefaultFilter: () => ({
    month: '05',
    year: '2026',
    page: 1,
    limit: 10,
  }),
  getOwnerPaymentHistory: vi.fn().mockResolvedValue({
    transactions: [],
    summary: { totalPayment: 0, totalRefund: 0, netRevenue: 0 },
    hasMore: false,
  }),
  getUserPaymentHistory: vi.fn(),
}));

it('renders owner payment heading in Vietnamese', async () => {
  localStorage.setItem('user', JSON.stringify({ user: { role_id: 2 } }));
  render(<PaymentHistory />);
  expect(await screen.findByRole('heading', { name: /lịch sử thanh toán chủ sân/i })).toBeInTheDocument();
});
```

- [ ] **Step 5: Thêm test baseline cho `OwnerReviews`**

```jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OwnerReviews from '../pages/OwnerReviews';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
  },
}));

it('renders owner review heading and empty state in Vietnamese', async () => {
  localStorage.setItem('user', JSON.stringify({ token: 'demo-token' }));
  render(<OwnerReviews />);
  expect(await screen.findByRole('heading', { name: /đánh giá khách hàng/i })).toBeInTheDocument();
});
```

- [ ] **Step 6: Chạy toàn bộ test baseline owner**

Run: `npm.cmd test -- src/test/owner-dashboard.test.jsx src/test/owner-payment-history.test.jsx src/test/owner-reviews.test.jsx`

Expected: ít nhất 1 test FAIL trước khi code UI owner mới.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/test/setup.js frontend/src/test/owner-dashboard.test.jsx frontend/src/test/owner-payment-history.test.jsx frontend/src/test/owner-reviews.test.jsx frontend/src/utils/ownerMetricsHelpers.js
git commit -m "test: add owner redesign baseline coverage"
```

### Task 2: Chuẩn hóa shell và token CSS cho workspace owner

**Files:**
- Modify: `frontend/src/components/MainLayout.jsx`
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/index.css`
- Test: `frontend/src/test/app-shell.test.jsx`

- [ ] **Step 1: Viết test thất bại cho owner entry trong shell**

```jsx
it('shows an owner workspace entry in Vietnamese for owner users', () => {
  vi.mocked(useAuth).mockReturnValueOnce({
    user: { user: { name: 'Chủ sân A', role_id: 2 } },
    logout: vi.fn(),
  });

  render(
    <MemoryRouter>
      <MainLayout />
    </MemoryRouter>
  );

  expect(screen.getByRole('link', { name: /khu vực chủ sân/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test**

Run: `npm.cmd test -- src/test/app-shell.test.jsx`

Expected: FAIL nếu owner entry chưa đủ rõ hoặc chưa render đúng điều kiện.

- [ ] **Step 3: Bổ sung owner shell classes và owner workspace cue**

```jsx
{isOwner && (
  <Link className="owner-shortcut text-decoration-none" to="/owner/dashboard">
    Khu vực chủ sân
  </Link>
)}
```

```css
.owner-shortcut {
  background: rgba(255, 107, 44, 0.08);
  border: 1px solid rgba(255, 107, 44, 0.16);
}

.owner-workspace-grid {
  display: grid;
  gap: 1.5rem;
}
```

- [ ] **Step 4: Bổ sung token/pattern cho analytics hero, KPI panel, chart panel, owner table**

```css
.owner-hero-panel,
.owner-kpi-card,
.owner-chart-panel,
.owner-table-panel,
.owner-review-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.owner-kpi-value {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
}
```

- [ ] **Step 5: Chạy test shell**

Run: `npm.cmd test -- src/test/app-shell.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/MainLayout.jsx frontend/src/App.css frontend/src/index.css frontend/src/test/app-shell.test.jsx
git commit -m "feat: add owner workspace shell tokens"
```

### Task 3: Redesign `OwnerDashboard` thành command center

**Files:**
- Modify: `frontend/src/pages/OwnerDashboard.jsx`
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/utils/ownerMetricsHelpers.js`
- Test: `frontend/src/test/owner-dashboard.test.jsx`

- [ ] **Step 1: Mở rộng test để khóa các section chính**

```jsx
it('renders command center sections for owner analytics', async () => {
  render(<OwnerDashboard />);

  expect(await screen.findByText(/doanh thu tháng này/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /hiệu suất sân theo lượt đặt/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /đơn gần đây/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test để xác nhận section mới chưa tồn tại**

Run: `npm.cmd test -- src/test/owner-dashboard.test.jsx`

Expected: FAIL.

- [ ] **Step 3: Thiết kế lại cấu trúc `OwnerDashboard`**

```jsx
return (
  <div className="account-page owner-workspace-grid">
    <section className="owner-hero-panel">
      <div className="owner-hero-copy">
        <p className="eyebrow">Command Center</p>
        <h1>Bảng điều khiển chủ sân</h1>
        <p>Theo dõi doanh thu, lịch đặt và chất lượng dịch vụ trên cùng một màn hình.</p>
      </div>
    </section>

    <section className="owner-kpi-grid">
      {/* KPI cards */}
    </section>

    <section className="owner-chart-grid">
      {/* chart panels */}
    </section>

    <section className="owner-table-panel">
      <h2>Đơn gần đây</h2>
    </section>
  </div>
);
```

- [ ] **Step 4: Giữ logic dữ liệu nhưng chuẩn hóa chart labels và summary**

```js
const summary = normalizeOwnerSummary({
  topField: stats.summary?.topField,
  peakHour: stats.summary?.peakHour,
  monthlyRevenue: stats.monthlyRevenue,
  todayBookings: stats.todayBookings,
});
```

- [ ] **Step 5: Thay màu ngẫu nhiên chart bằng palette cố định có ngữ nghĩa**

```js
const CHART_COLORS = ['#ff6b2c', '#1f9d55', '#3156c9', '#ffb020', '#7c5cff'];
```

- [ ] **Step 6: Chạy test dashboard**

Run: `npm.cmd test -- src/test/owner-dashboard.test.jsx`

Expected: PASS.

- [ ] **Step 7: Chạy build nhanh sau dashboard**

Run: `npm.cmd run build`

Expected: build PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/OwnerDashboard.jsx frontend/src/App.css frontend/src/utils/ownerMetricsHelpers.js frontend/src/test/owner-dashboard.test.jsx
git commit -m "feat: redesign owner dashboard command center"
```

### Task 4: Redesign `PaymentHistory` cho vai trò owner

**Files:**
- Modify: `frontend/src/pages/PaymentHistory.jsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/src/test/owner-payment-history.test.jsx`

- [ ] **Step 1: Mở rộng test cho owner financial layout**

```jsx
it('renders owner financial summary panels and owner-specific labels', async () => {
  localStorage.setItem('user', JSON.stringify({ user: { role_id: 2 } }));
  render(<PaymentHistory />);

  expect(await screen.findByText(/tổng thanh toán/i)).toBeInTheDocument();
  expect(screen.getByText(/tổng hoàn tiền/i)).toBeInTheDocument();
  expect(screen.getByText(/doanh thu thực nhận/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test**

Run: `npm.cmd test -- src/test/owner-payment-history.test.jsx`

Expected: FAIL nếu layout owner chưa khác biệt đủ hoặc labels chưa ổn định.

- [ ] **Step 3: Tách rõ owner mode trong UI và nâng layout tài chính**

```jsx
{isOwner ? (
  <div className="owner-finance-grid">
    {/* owner financial hero + summary cards + filters + table */}
  </div>
) : (
  <div className="account-page">
    {/* keep current user flow */}
  </div>
)}
```

- [ ] **Step 4: Thêm panel filter và table owner đậm chất analytics hơn**

```css
.owner-finance-grid {
  display: grid;
  gap: 1.5rem;
}

.owner-table-panel table thead th {
  color: var(--color-text-muted);
  font-weight: 700;
}
```

- [ ] **Step 5: Giữ API dùng chung nhưng chuẩn hóa copy owner hoàn toàn tiếng Việt**

```jsx
title="Lịch sử thanh toán chủ sân"
description="Theo dõi dòng tiền, các khoản hoàn tiền và doanh thu thực nhận theo từng giai đoạn."
```

- [ ] **Step 6: Chạy test payment history owner**

Run: `npm.cmd test -- src/test/owner-payment-history.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/PaymentHistory.jsx frontend/src/App.css frontend/src/test/owner-payment-history.test.jsx
git commit -m "feat: redesign owner finance workspace"
```

### Task 5: Redesign `OwnerReviews` thành quality management screen

**Files:**
- Modify: `frontend/src/pages/OwnerReviews.jsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/src/test/owner-reviews.test.jsx`

- [ ] **Step 1: Mở rộng test để khóa review panel**

```jsx
it('renders owner review management sections in Vietnamese', async () => {
  render(<OwnerReviews />);

  expect(await screen.findByRole('heading', { name: /đánh giá khách hàng/i })).toBeInTheDocument();
  expect(screen.getByText(/chất lượng dịch vụ/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test**

Run: `npm.cmd test -- src/test/owner-reviews.test.jsx`

Expected: FAIL.

- [ ] **Step 3: Viết lại `OwnerReviews` theo card layout và reply area rõ ràng**

```jsx
return (
  <div className="account-page owner-workspace-grid">
    <section className="owner-hero-panel">
      <p className="eyebrow">Service Quality</p>
      <h1>Đánh giá khách hàng</h1>
      <p>Theo dõi cảm nhận của khách và phản hồi nhanh để cải thiện trải nghiệm.</p>
    </section>

    <section className="owner-review-grid">
      {reviews.map((review) => (
        <article key={review.id} className="owner-review-panel">
          {/* summary + reply area */}
        </article>
      ))}
    </section>
  </div>
);
```

- [ ] **Step 4: Giữ nghiệp vụ reply, nhưng đổi sang state theo review thay vì một input chung nếu cần**

```jsx
const [replyDrafts, setReplyDrafts] = useState({});

const handleDraftChange = (reviewId, value) => {
  setReplyDrafts((prev) => ({ ...prev, [reviewId]: value }));
};
```

- [ ] **Step 5: Bổ sung empty/loading/error state theo visual system owner**

```jsx
if (loading) return <div className="account-empty-state">Đang tải đánh giá khách hàng...</div>;
if (!reviews.length) return <div className="account-empty-state">Chưa có đánh giá nào cần xử lý.</div>;
```

- [ ] **Step 6: Chạy test owner reviews**

Run: `npm.cmd test -- src/test/owner-reviews.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/OwnerReviews.jsx frontend/src/App.css frontend/src/test/owner-reviews.test.jsx
git commit -m "feat: redesign owner review management"
```

### Task 6: Kiểm thử tích hợp owner phase 2 và hoàn thiện văn bản tiếng Việt

**Files:**
- Modify: các file đã chạm trong task 2-5 nếu phát hiện text lỗi dấu hoặc panel chưa nhất quán
- Optional Modify: `frontend/src/pages/BookingHistory.jsx` nếu cần tinh chỉnh nhãn owner liên quan để đồng giọng

- [ ] **Step 1: Chạy toàn bộ test frontend**

Run: `npm.cmd test`

Expected: toàn bộ test PASS.

- [ ] **Step 2: Chạy build production**

Run: `npm.cmd run build`

Expected: build PASS, chỉ chấp nhận cảnh báo chunk size nếu không phát sinh lỗi mới.

- [ ] **Step 3: Kiểm tra lint có chọn lọc trên các file owner phase 2**

Run: `.\\node_modules\\.bin\\eslint.cmd src/pages/OwnerDashboard.jsx src/pages/OwnerReviews.jsx src/pages/PaymentHistory.jsx src/components/MainLayout.jsx src/utils/ownerMetricsHelpers.js src/test/owner-dashboard.test.jsx src/test/owner-payment-history.test.jsx src/test/owner-reviews.test.jsx`

Expected: không có lỗi mới trong các file owner vừa chỉnh.

- [ ] **Step 4: Kiểm tra thủ công các breakpoint chính**

Run: `npm.cmd run dev`

Expected: kiểm tra tại:
- desktop `1440x900`
- tablet `1024x768`
- mobile `390x844`

Xác nhận:
- dashboard owner có thứ bậc thông tin rõ
- payment history owner có cảm giác analytics rõ ràng
- review management dễ đọc và dễ phản hồi
- không lẫn tiếng Anh không cần thiết
- màu sắc vẫn đồng bộ với phase 1 user

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/OwnerDashboard.jsx frontend/src/pages/OwnerReviews.jsx frontend/src/pages/PaymentHistory.jsx frontend/src/components/MainLayout.jsx frontend/src/App.css frontend/src/index.css frontend/src/utils/ownerMetricsHelpers.js frontend/src/test
git commit -m "chore: finalize owner phase 2 redesign"
```

## Tự rà soát plan với spec

- Spec coverage: plan bao phủ `OwnerDashboard`, `PaymentHistory` vai trò owner, `OwnerReviews`, owner shell polish, token CSS, loading/empty/error states, tiếng Việt và desktop-first responsive.
- Placeholder scan: không dùng `TBD`, `TODO`, hoặc bước mô tả mơ hồ không có lệnh/test/đoạn code minh họa.
- Type consistency: các file, component và helper được đặt theo đúng codebase hiện tại; `PaymentHistory` vẫn dùng chung cho user/owner nhưng có nhánh UI riêng cho owner trong task 4.

# User Booking UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mới toàn bộ giao diện người dùng đặt sân theo phong cách thể thao hiện đại, dùng một font duy nhất, chuẩn hóa tiếng Việt và giữ nguyên chức năng hiện có.

**Architecture:** Đợt triển khai này giữ nguyên router, API và luồng nghiệp vụ hiện tại, nhưng thay toàn bộ lớp trình bày bằng một visual system mới dùng chung cho `MainLayout`, trang danh sách sân, thẻ sân, trang chi tiết và các trang tài khoản người dùng. Cách làm ưu tiên tạo token CSS và các khối giao diện dùng lại được trước, sau đó áp vào từng màn hình theo thứ tự từ điểm chạm lớn nhất đến các trang phụ trợ.

**Tech Stack:** React 19, Vite 8, React Router 7, Bootstrap 5 utilities, Axios, ESLint, Prettier, Vitest, React Testing Library

---

### Task 1: Thiết lập nền kiểm thử và visual token toàn cục

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/setup.js`
- Create: `frontend/src/test/app-shell.test.jsx`

- [ ] **Step 1: Viết test khởi tạo để khóa yêu cầu font duy nhất và khung app render được**

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

describe('App shell', () => {
  it('renders the main navigation in Vietnamese', () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /trang chủ/i })).toBeInTheDocument();
  });

  it('defines one global font family token', () => {
    document.documentElement.innerHTML = '<div id="root"></div>';
    const rootStyle = getComputedStyle(document.documentElement);

    expect(rootStyle.getPropertyValue('--font-family-base').trim()).not.toEqual('');
  });
});
```

- [ ] **Step 2: Cài cấu hình test cho Vitest và RTL**

Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

Expected: cài thêm 4 gói dev dependency thành công, không đổi dependency production.

- [ ] **Step 3: Bổ sung script test và cấu hình Vitest**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run"
  }
}
```

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
```

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Tạo token CSS toàn cục cho màu sắc, font và spacing**

```css
:root {
  --font-family-base: 'Be Vietnam Pro', sans-serif;
  --color-bg: #f4f7fb;
  --color-surface: #ffffff;
  --color-surface-muted: #edf2f7;
  --color-text: #172033;
  --color-text-muted: #60708f;
  --color-border: rgba(23, 32, 51, 0.08);
  --color-accent: #ff6b2c;
  --color-accent-strong: #f04e23;
  --color-success: #1f9d55;
  --shadow-soft: 0 18px 40px rgba(23, 32, 51, 0.08);
  --shadow-card: 0 22px 50px rgba(23, 32, 51, 0.12);
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
}

body {
  font-family: var(--font-family-base);
  background: radial-gradient(circle at top, #fff7f2 0%, #f4f7fb 42%, #eef3f8 100%);
  color: var(--color-text);
}
```

- [ ] **Step 5: Chạy test để xác nhận nền mới hoạt động**

Run: `npm test`

Expected: PASS cho `app-shell.test.jsx`.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/vite.config.js frontend/src/index.css frontend/src/App.css frontend/src/test/setup.js frontend/src/test/app-shell.test.jsx
git commit -m "test: add frontend ui baseline coverage"
```

### Task 2: Làm mới `MainLayout` và chuẩn hóa điều hướng tiếng Việt

**Files:**
- Modify: `frontend/src/components/MainLayout.jsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/src/test/app-shell.test.jsx`

- [ ] **Step 1: Viết test thất bại cho menu tiếng Việt và liên kết tài khoản**

```jsx
it('shows Vietnamese navigation labels in the header', () => {
  render(
    <MemoryRouter>
      <MainLayout />
    </MemoryRouter>
  );

  expect(screen.getByRole('link', { name: /trang chủ/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /bóng đá/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /cầu lông/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /pickleball/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test để xác nhận đang fail vì layout cũ chưa đạt chuẩn**

Run: `npm test -- app-shell.test.jsx`

Expected: FAIL nếu nhãn điều hướng chưa được chuẩn hóa hoặc component chưa render ổn trong test.

- [ ] **Step 3: Viết lại cấu trúc header, menu mobile và khung nội dung**

```jsx
const userLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/football', label: 'Bóng đá' },
  { to: '/badminton', label: 'Cầu lông' },
  { to: '/pickleball', label: 'Pickleball' },
];

return (
  <div className="app-shell">
    <header className="main-header">
      <div className="main-header__inner">
        <Link to="/" className="brand-mark">
          Sân Việt
        </Link>
        <nav className="main-nav">
          {userLinks.map((link) => (
            <Link key={link.to} to={link.to} className={navClassName(link.to)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <button type="button" className="account-trigger" onClick={handleSidebarOpen}>
          Tài khoản
        </button>
      </div>
    </header>

    <main className="page-shell">
      <Outlet />
    </main>
  </div>
);
```

- [ ] **Step 4: Thêm style header mới và đồng nhất font, khoảng cách, màu nhấn**

```css
.main-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(18px);
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid var(--color-border);
}

.brand-mark {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
  text-decoration: none;
}

.main-nav__link.is-active {
  color: var(--color-accent-strong);
  background: rgba(255, 107, 44, 0.12);
}
```

- [ ] **Step 5: Chuẩn hóa toàn bộ nhãn sidebar/account sang tiếng Việt**

```jsx
const accountActions = [
  { to: '/profile', label: 'Hồ sơ của tôi', icon: 'bi-person' },
  { to: '/history', label: 'Lịch sử đặt sân', icon: 'bi-calendar-check' },
  { to: '/payment-history', label: 'Lịch sử thanh toán', icon: 'bi-wallet2' },
  { to: '/favorites', label: 'Sân yêu thích', icon: 'bi-heart' },
  { to: '/complaints', label: 'Khiếu nại của tôi', icon: 'bi-chat-left-text' },
  { to: '/my-reviews', label: 'Đánh giá của tôi', icon: 'bi-star' },
];
```

- [ ] **Step 6: Chạy test và lint**

Run: `npm test -- app-shell.test.jsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS hoặc chỉ còn cảnh báo cũ ngoài phạm vi task.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/MainLayout.jsx frontend/src/App.css frontend/src/test/app-shell.test.jsx
git commit -m "feat: redesign user app shell"
```

### Task 3: Thiết kế lại trang danh sách sân và bộ lọc

**Files:**
- Modify: `frontend/src/pages/FieldListPage.jsx`
- Modify: `frontend/src/components/FilterSidebar.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/field-list-page.test.jsx`

- [ ] **Step 1: Viết test thất bại cho hero, thanh ngữ cảnh và bộ lọc tiếng Việt**

```jsx
import { render, screen } from '@testing-library/react';
import FieldListPage from '../pages/FieldListPage';

vi.mock('../components/FilterSidebar', () => ({
  default: ({ onResults }) => (
    <button onClick={() => onResults([])}>Lọc sân</button>
  ),
}));

it('renders the discovery hero and listing context in Vietnamese', () => {
  render(<FieldListPage />);

  expect(screen.getByText(/đặt sân theo phong cách thể thao hiện đại/i)).toBeInTheDocument();
  expect(screen.getByText(/khám phá sân phù hợp quanh bạn/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test để xác nhận text mới chưa tồn tại**

Run: `npm test -- field-list-page.test.jsx`

Expected: FAIL.

- [ ] **Step 3: Viết lại hero, quick chip và context bar của trang danh sách**

```jsx
const sportChips = [
  { to: '/football', label: 'Bóng đá' },
  { to: '/badminton', label: 'Cầu lông' },
  { to: '/pickleball', label: 'Pickleball' },
];

return (
  <div className="listing-page">
    <section className="listing-hero">
      <div className="listing-hero__content">
        <p className="eyebrow">Nền tảng đặt sân dành cho cộng đồng thể thao</p>
        <h1>Đặt sân theo phong cách thể thao hiện đại</h1>
        <p>Khám phá sân phù hợp quanh bạn với hình ảnh rõ ràng, thông tin gọn và bộ lọc dễ dùng.</p>
        <div className="sport-chip-row">
          {sportChips.map((chip) => (
            <Link key={chip.to} to={chip.to} className="sport-chip">
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="listing-context-bar">
      <strong>{fields.length} sân phù hợp</strong>
      <span>Bạn có thể lọc theo môn, giá và khu vực.</span>
    </section>
  </div>
);
```

- [ ] **Step 4: Làm mới `FilterSidebar` theo dạng panel hiện đại và giữ nguyên API lọc**

```jsx
return (
  <aside className="filter-panel">
    <div className="filter-panel__header">
      <h2>Bộ lọc tìm sân</h2>
      <button type="button" className="filter-reset" onClick={clearFilters}>
        Xóa bộ lọc
      </button>
    </div>

    <label className="filter-label" htmlFor="keyword">
      Từ khóa hoặc khu vực
    </label>
    <input
      id="keyword"
      name="keyword"
      value={filters.keyword}
      onChange={handleChange}
      placeholder="Ví dụ: Quận 7, sân cỏ nhân tạo"
      className="filter-input"
    />
  </aside>
);
```

- [ ] **Step 5: Thêm state rỗng và loading mới bằng tiếng Việt**

```jsx
{loading ? (
  <div className="listing-state-card">Đang tải danh sách sân...</div>
) : fields.length === 0 ? (
  <div className="listing-state-card">
    <h3>Chưa tìm thấy sân phù hợp</h3>
    <p>Hãy thử nới rộng giá hoặc xóa bớt điều kiện lọc.</p>
  </div>
) : (
  <div className="row g-4">{/* render card */}</div>
)}
```

- [ ] **Step 6: Bổ sung CSS cho hero, sticky filter và responsive drawer hook**

```css
.listing-hero {
  padding: 4.5rem 0 3rem;
  background:
    linear-gradient(135deg, rgba(16, 23, 36, 0.8), rgba(240, 78, 35, 0.32)),
    url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1600') center/cover;
  color: #fff;
}

.filter-panel {
  position: sticky;
  top: 6.5rem;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 7: Chạy test và lint**

Run: `npm test -- field-list-page.test.jsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS hoặc chỉ còn cảnh báo cũ ngoài phạm vi task.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/FieldListPage.jsx frontend/src/components/FilterSidebar.jsx frontend/src/App.css frontend/src/test/field-list-page.test.jsx
git commit -m "feat: redesign field listing experience"
```

### Task 4: Làm mới `FieldCard` và trạng thái tương tác yêu thích

**Files:**
- Modify: `frontend/src/components/FieldCard.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/field-card.test.jsx`

- [ ] **Step 1: Viết test thất bại cho card mới**

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FieldCard from '../components/FieldCard';

const field = {
  id: 1,
  name: 'Sân Bảy Phúc',
  address: 'Quận 7, TP. Hồ Chí Minh',
  type: 'football',
  price: 250000,
  image: 'https://example.com/field.jpg',
};

it('renders price, location and booking action in Vietnamese', () => {
  render(
    <MemoryRouter>
      <FieldCard field={field} detailPath="/field/1" />
    </MemoryRouter>
  );

  expect(screen.getByText(/quận 7/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /xem lịch và đặt sân/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test**

Run: `npm test -- field-card.test.jsx`

Expected: FAIL.

- [ ] **Step 3: Cập nhật markup card để ưu tiên ảnh, badge và CTA**

```jsx
return (
  <article className="field-card" onClick={handleCardClick}>
    <div className="field-card__media">
      <img src={field.image} alt={field.name} className="field-card__image" />
      <span className="field-card__status">Còn nhận đặt</span>
      <button type="button" className="field-card__favorite" onClick={(event) => handleFavorite(event, field.id)}>
        {favorites.includes(field.id) ? 'Đã yêu thích' : 'Yêu thích'}
      </button>
    </div>

    <div className="field-card__body">
      <span className={`field-card__badge ${badge.color}`}>{badge.label}</span>
      <h3>{field.name}</h3>
      <p className="field-card__location">{field.address}</p>
      <div className="field-card__footer">
        <div>
          <strong>{Number(field.price).toLocaleString('vi-VN')}đ</strong>
          <span>/ giờ</span>
        </div>
        <button type="button" className="field-card__cta">
          Xem lịch và đặt sân
        </button>
      </div>
    </div>
  </article>
);
```

- [ ] **Step 4: Thêm CSS hover, overlay và bố cục card**

```css
.field-card {
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.field-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-card);
}
```

- [ ] **Step 5: Chuẩn hóa nhãn card sang tiếng Việt tự nhiên**

```jsx
const availabilityLabel = 'Còn nhận đặt';
const bookingLabel = 'Xem lịch và đặt sân';
const favoriteLabel = favorites.includes(field.id) ? 'Bỏ yêu thích' : 'Yêu thích';
```

- [ ] **Step 6: Chạy test và lint**

Run: `npm test -- field-card.test.jsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS hoặc chỉ còn cảnh báo cũ ngoài phạm vi task.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/FieldCard.jsx frontend/src/App.css frontend/src/test/field-card.test.jsx
git commit -m "feat: redesign field card presentation"
```

### Task 5: Nâng cấp `FieldDetail` và `StadiumDetail`

**Files:**
- Modify: `frontend/src/pages/FieldDetail.jsx`
- Modify: `frontend/src/pages/StadiumDetail.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/field-detail.test.jsx`

- [ ] **Step 1: Viết test thất bại cho khối thông tin chính và CTA sticky**

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FieldDetail from '../pages/FieldDetail';

it('renders the detail summary shell in Vietnamese', () => {
  render(
    <MemoryRouter>
      <FieldDetail />
    </MemoryRouter>
  );

  expect(screen.getByText(/thông tin sân/i)).toBeInTheDocument();
  expect(screen.getByText(/lịch đặt sân/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test**

Run: `npm test -- field-detail.test.jsx`

Expected: FAIL.

- [ ] **Step 3: Thiết kế lại `FieldDetail` theo cấu trúc gallery, tóm tắt và vùng đặt sân**

```jsx
return (
  <div className="detail-page">
    <section className="detail-hero">{/* gallery */}</section>

    <section className="detail-summary">
      <div>
        <p className="detail-eyebrow">Thông tin sân</p>
        <h1>{field.name}</h1>
        <p>{field.address}</p>
      </div>
      <div className="detail-price-box">
        <strong>{priceLabel}</strong>
        <span>mỗi giờ</span>
      </div>
    </section>

    <section className="detail-grid">
      <article className="detail-panel">
        <h2>Lịch đặt sân</h2>
      </article>
      <aside className="detail-panel detail-panel--sticky">
        <button type="button" className="primary-action">Đặt sân ngay</button>
      </aside>
    </section>
  </div>
);
```

- [ ] **Step 4: Thay placeholder `StadiumDetail` bằng trang khám phá cơ sở thật**

```jsx
return (
  <div className="stadium-page">
    <section className="detail-summary">
      <div>
        <p className="detail-eyebrow">Cụm sân thể thao</p>
        <h1>{stadium.name}</h1>
        <p>{stadium.address}</p>
      </div>
    </section>

    <section className="related-fields-section">
      <h2>Danh sách sân trong cụm</h2>
    </section>
  </div>
);
```

- [ ] **Step 5: Bổ sung CSS cho detail page, panel sticky và layout mobile**

```css
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.9fr);
  gap: 1.5rem;
}

.detail-panel--sticky {
  position: sticky;
  top: 7rem;
}

@media (max-width: 991.98px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Chạy test và lint**

Run: `npm test -- field-detail.test.jsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS hoặc chỉ còn cảnh báo cũ ngoài phạm vi task.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/FieldDetail.jsx frontend/src/pages/StadiumDetail.jsx frontend/src/App.css frontend/src/test/field-detail.test.jsx
git commit -m "feat: redesign field and stadium detail pages"
```

### Task 6: Đồng bộ các trang tài khoản người dùng và chuẩn hóa tiếng Việt

**Files:**
- Modify: `frontend/src/pages/FavoritesPage.jsx`
- Modify: `frontend/src/pages/BookingHistory.jsx`
- Modify: `frontend/src/pages/PaymentHistory.jsx`
- Modify: `frontend/src/pages/ProfilePage.jsx`
- Modify: `frontend/src/pages/MyComplaints.jsx`
- Modify: `frontend/src/components/MyReviews.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/account-pages.test.jsx`

- [ ] **Step 1: Viết test thất bại cho khung tài khoản dùng chung**

```jsx
import { render, screen } from '@testing-library/react';
import FavoritesPage from '../pages/FavoritesPage';

it('renders account page headings in Vietnamese', () => {
  render(<FavoritesPage />);
  expect(screen.getByRole('heading', { name: /sân yêu thích/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test**

Run: `npm test -- account-pages.test.jsx`

Expected: FAIL.

- [ ] **Step 3: Tạo khung tiêu đề và nội dung nhất quán cho các trang tài khoản**

```jsx
const AccountPageHeader = ({ eyebrow, title, description }) => (
  <header className="account-page-header">
    <p className="account-page-header__eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p>{description}</p>
  </header>
);
```

```jsx
<AccountPageHeader
  eyebrow="Tài khoản"
  title="Sân yêu thích"
  description="Xem nhanh những sân bạn đã lưu để đặt lại thuận tiện hơn."
/>;
```

- [ ] **Step 4: Chuẩn hóa văn bản, empty state và lỗi dấu tiếng Việt trên các trang tài khoản**

```jsx
const emptyMessages = {
  favorites: 'Bạn chưa lưu sân nào. Hãy khám phá danh sách sân để thêm mục yêu thích.',
  bookingHistory: 'Bạn chưa có lịch đặt sân nào.',
  paymentHistory: 'Chưa có giao dịch thanh toán nào để hiển thị.',
  reviews: 'Bạn chưa gửi đánh giá nào.',
};
```

- [ ] **Step 5: Thêm style dùng chung cho account shell**

```css
.account-page-header,
.account-card,
.account-empty-state {
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 6: Chạy test và lint**

Run: `npm test -- account-pages.test.jsx`

Expected: PASS.

Run: `npm run lint`

Expected: PASS hoặc chỉ còn cảnh báo cũ ngoài phạm vi task.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/FavoritesPage.jsx frontend/src/pages/BookingHistory.jsx frontend/src/pages/PaymentHistory.jsx frontend/src/pages/ProfilePage.jsx frontend/src/pages/MyComplaints.jsx frontend/src/components/MyReviews.jsx frontend/src/App.css frontend/src/test/account-pages.test.jsx
git commit -m "feat: unify user account pages"
```

### Task 7: Kiểm thử hồi quy, sửa chuỗi còn sót và hoàn thiện responsive

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Home.jsx`
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/index.css`
- Modify: các file trong phạm vi task 2-6 nếu phát hiện chuỗi tiếng Anh hoặc lỗi dấu còn sót

- [ ] **Step 1: Viết test smoke cuối cho router công khai**

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

it('shows a Vietnamese not-found message for unknown routes', () => {
  render(
    <MemoryRouter initialEntries={['/khong-ton-tai']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/không tồn tại/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy test để xác nhận còn điểm cần chuẩn hóa**

Run: `npm test`

Expected: có thể FAIL ở một số text chưa đồng bộ hoặc component chưa tương thích test.

- [ ] **Step 3: Sửa các text tiếng Anh, lỗi dấu và fallback cũ còn sót**

```jsx
<h1>403 - Bạn không có quyền truy cập</h1>
<h1>404 - Trang bạn tìm không tồn tại</h1>
```

```jsx
<p>Chọn cơ sở và đặt sân ngay hôm nay</p>
```

- [ ] **Step 4: Rà responsive ở các breakpoint chính và tinh chỉnh CSS**

Run: `npm run build`

Expected: `vite build` thành công.

Run: `npm test`

Expected: toàn bộ test PASS.

- [ ] **Step 5: Kiểm tra thủ công**

Run: `npm run dev`

Expected: mở app cục bộ để kiểm tra 3 breakpoint chính:
- mobile khoảng `390x844`
- tablet khoảng `768x1024`
- desktop khoảng `1440x900`

Xác nhận:
- header không vỡ layout
- filter dùng được trên mobile
- card sân rõ ràng, CTA dễ bấm
- trang chi tiết có CTA nổi bật
- trang tài khoản cùng một visual system
- không còn text tiếng Anh ngoài thương hiệu hoặc từ phổ biến được chấp nhận

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/Home.jsx frontend/src/App.css frontend/src/index.css frontend/src/pages frontend/src/components
git commit -m "chore: finalize user booking ui redesign"
```

## Tự rà soát plan với spec

- Spec coverage: plan đã bao phủ `MainLayout`, `FieldListPage`, `FieldCard`, `FilterSidebar`, `FieldDetail`, `StadiumDetail`, các trang tài khoản chính, font duy nhất, chuẩn hóa tiếng Việt, state loading/empty/error và responsive.
- Placeholder scan: không dùng `TBD`, `TODO`, `implement later` hoặc câu mô tả mơ hồ không có ví dụ.
- Type consistency: các tên component và file đều bám theo codebase hiện tại; nếu trong lúc triển khai phát hiện `FieldDetail` hoặc trang tài khoản có API khác với dự kiến, phải chỉnh ngay task liên quan trước khi code tiếp.

# Payment History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a unified payment-history experience where users see only their own payment and refund transactions, while owners see all payment and refund transactions across their stadiums with revenue summary.

**Architecture:** The backend keeps `Booking` as the transaction source and normalizes each booking into payment and refund timeline items through `backend/utils/paymentHistory.js`. The frontend uses one shared `PaymentHistory.jsx` page that switches endpoint, columns, and summary cards by role, while owner navigation is migrated from the old refund-history page to the broader payment-history page.

**Tech Stack:** Node.js, Express, Sequelize, React, Axios, React Router, Vite, Node built-in test runner.

---

## File Structure

- `backend/utils/paymentHistory.js`
  Responsibility: Build transaction rows from bookings, resolve date filters, and paginate transaction arrays.
- `backend/controllers/bookingController.js`
  Responsibility: Query role-scoped bookings, transform them into transaction history, and shape summary responses.
- `backend/routes/bookingRoutes.js`
  Responsibility: Expose payment-history endpoints without disturbing existing booking routes.
- `backend/tests/paymentHistory.test.js`
  Responsibility: Cover helper behavior and controller responses for user and owner payment history.
- `frontend/src/services/paymentHistoryService.js`
  Responsibility: Call the two backend payment-history endpoints and build consistent query params.
- `frontend/src/pages/PaymentHistory.jsx`
  Responsibility: Render one role-aware page for user and owner payment history.
- `frontend/src/App.jsx`
  Responsibility: Register the user route and swap owner route from refund-history to payment-history.
- `frontend/src/components/MainLayout.jsx`
  Responsibility: Update owner navigation label and destination.
- `docs/plans/planpaymenthistory.md`
  Responsibility: Sync the Vietnamese planning note with the implemented behavior.

### Task 1: Add Backend Regression Tests For Payment History

**Files:**
- Create: `backend/tests/paymentHistory.test.js`
- Modify: `backend/package.json`
- Read: `backend/utils/paymentHistory.js`
- Read: `backend/controllers/bookingController.js`

- [ ] **Step 1: Write the failing helper tests**

Create `backend/tests/paymentHistory.test.js`
```javascript
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPaymentHistoryTransactions,
  filterTransactionsByDateRange,
  paginateTransactions,
  resolveHistoryFilters,
} = require("../utils/paymentHistory");

function createBooking(overrides = {}) {
  return {
    id: 101,
    amount_paid: 500000,
    payment_status: "paid",
    payment_method: "momo",
    payment_recorded_at: new Date("2026-05-10T08:15:00.000Z"),
    createdAt: new Date("2026-05-10T08:00:00.000Z"),
    refunded_at: new Date("2026-05-11T09:00:00.000Z"),
    refund_reason: "Khach huy san",
    status: "refunded",
    field: {
      name: "San 1",
      stadium: { name: "San ABC" },
    },
    user: {
      name: "Nguyen Van A",
      phone: "0912345678",
    },
    ...overrides,
  };
}

test("buildPaymentHistoryTransactions creates payment and refund rows", () => {
  const transactions = buildPaymentHistoryTransactions([createBooking()]);

  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].type, "refund");
  assert.equal(transactions[1].type, "payment");
});

test("payment transaction prefers payment_recorded_at over createdAt", () => {
  const paymentTransaction = buildPaymentHistoryTransactions([
    createBooking({
      refunded_at: null,
      payment_recorded_at: new Date("2026-05-10T12:00:00.000Z"),
      createdAt: new Date("2026-05-10T01:00:00.000Z"),
    }),
  ])[0];

  assert.equal(
    new Date(paymentTransaction.transactionDate).toISOString(),
    "2026-05-10T12:00:00.000Z",
  );
});

test("cancelled booking with financial activity stays visible", () => {
  const transactions = buildPaymentHistoryTransactions([
    createBooking({ status: "cancelled" }),
  ]);

  assert.equal(transactions.length, 2);
});

test("booking without payment and refund is excluded", () => {
  const transactions = buildPaymentHistoryTransactions([
    createBooking({
      amount_paid: 0,
      payment_status: "unpaid",
      payment_recorded_at: null,
      refunded_at: null,
    }),
  ]);

  assert.equal(transactions.length, 0);
});

test("filterTransactionsByDateRange uses transaction timestamps", () => {
  const transactions = buildPaymentHistoryTransactions([createBooking()]);
  const filters = resolveHistoryFilters({
    startDate: "2026-05-11",
    endDate: "2026-05-11",
  });

  const filtered = filterTransactionsByDateRange(
    transactions,
    filters.startDate,
    filters.endDate,
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].type, "refund");
});

test("resolveHistoryFilters defaults to the current month in Vietnam time", () => {
  const filters = resolveHistoryFilters({}, new Date("2026-05-13T03:00:00.000Z"));

  assert.equal(filters.startDate.toISOString(), "2026-04-30T17:00:00.000Z");
  assert.equal(filters.endDate.toISOString(), "2026-05-31T16:59:59.999Z");
});

test("paginateTransactions slices transactions by page and limit", () => {
  const rows = [
    { bookingId: 1 },
    { bookingId: 2 },
    { bookingId: 3 },
  ];

  const page = paginateTransactions(rows, 2, 2);

  assert.deepEqual(page, [{ bookingId: 3 }]);
});
```

- [ ] **Step 2: Run helper tests to verify they fail for the right reason**

Run: `node --test backend/tests/paymentHistory.test.js`
Expected: FAIL on at least one assertion because the current helper behavior does not yet match the spec and because the new test file is being executed for the first time.

- [ ] **Step 3: Add controller tests in the same file**

Append this block to `backend/tests/paymentHistory.test.js`
```javascript
test("getUserPaymentHistory returns only the authenticated user's summary", async () => {
  const originalModels = require.cache[require.resolve("../models")];
  const originalSocket = require.cache[require.resolve("../socket")];

  const bookings = [
    createBooking({
      id: 201,
      refunded_at: null,
      payment_recorded_at: new Date("2026-05-09T08:00:00.000Z"),
    }),
  ];

  require.cache[require.resolve("../models")] = {
    exports: {
      Booking: { findAll: async () => bookings },
      Field: {},
      Stadium: {},
      User: {},
      Sequelize: { Op: {}, fn: () => {}, col: () => {}, literal: () => {} },
    },
  };
  require.cache[require.resolve("../socket")] = {
    exports: { getIO: () => ({ to: () => ({ emit: () => {} }) }), userSockets: {} },
  };

  delete require.cache[require.resolve("../controllers/bookingController")];
  const controller = require("../controllers/bookingController");

  const response = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };

  await controller.getUserPaymentHistory(
    {
      user: { id: 7 },
      query: { month: "05", year: "2026", page: "1", limit: "10" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.success, true);
  assert.equal(response.payload.transactions.length, 1);
  assert.equal(response.payload.summary.totalPayment, 500000);
  assert.equal(response.payload.summary.totalRefund, 0);

  if (originalModels) {
    require.cache[require.resolve("../models")] = originalModels;
  }
  if (originalSocket) {
    require.cache[require.resolve("../socket")] = originalSocket;
  }
});

test("getOwnerPaymentHistory returns owner summary and customer fields", async () => {
  const originalModels = require.cache[require.resolve("../models")];
  const originalSocket = require.cache[require.resolve("../socket")];

  const bookings = [
    createBooking({
      id: 301,
      status: "refunded",
    }),
  ];

  require.cache[require.resolve("../models")] = {
    exports: {
      Booking: { findAll: async () => bookings },
      Field: {},
      Stadium: { findAll: async () => [{ id: 9 }] },
      User: {},
      Sequelize: { Op: {}, fn: () => {}, col: () => {}, literal: () => {} },
    },
  };
  require.cache[require.resolve("../socket")] = {
    exports: { getIO: () => ({ to: () => ({ emit: () => {} }) }), userSockets: {} },
  };

  delete require.cache[require.resolve("../controllers/bookingController")];
  const controller = require("../controllers/bookingController");

  const response = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };

  await controller.getOwnerPaymentHistory(
    {
      user: { id: 88 },
      query: { month: "05", year: "2026", page: "1", limit: "10" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.success, true);
  assert.equal(response.payload.summary.totalPayment, 500000);
  assert.equal(response.payload.summary.totalRefund, 500000);
  assert.equal(response.payload.summary.netRevenue, 0);
  assert.equal(response.payload.transactions[0].userName, "Nguyen Van A");

  if (originalModels) {
    require.cache[require.resolve("../models")] = originalModels;
  }
  if (originalSocket) {
    require.cache[require.resolve("../socket")] = originalSocket;
  }
});
```

- [ ] **Step 4: Run the new full test file to verify controller assertions fail before code changes**

Run: `node --test backend/tests/paymentHistory.test.js`
Expected: FAIL in helper behavior and-or controller response shape, proving the tests exercise the current implementation instead of passing accidentally.

- [ ] **Step 5: Ensure backend test script exists**

Confirm `backend/package.json` contains:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "npx nodemon server.js",
    "test": "node --test"
  }
}
```

- [ ] **Step 6: Commit the red tests**

```bash
git add backend/package.json backend/tests/paymentHistory.test.js
git commit -m "test: add payment history coverage"
```

### Task 2: Align Backend Helper With The Approved Financial Rules

**Files:**
- Modify: `backend/utils/paymentHistory.js`
- Test: `backend/tests/paymentHistory.test.js`

- [ ] **Step 1: Update helper behavior to match the spec**

Update `backend/utils/paymentHistory.js`
```javascript
function getPaymentTransactionDate(booking) {
  return booking.payment_recorded_at || booking.payment_completed_at || booking.createdAt;
}

function createTransaction(booking, type, transactionDate) {
  parseRequiredDate(transactionDate, "transaction date");
  const stadiumName = booking?.stadium?.name || booking?.field?.stadium?.name || null;
  const fieldName = booking?.field?.name || null;
  const amount = toNumber(booking.amount_paid);

  return {
    bookingId: booking.id,
    bookingStatus: booking.status,
    type,
    amount,
    refundAmount: type === "refund" ? amount : 0,
    actualRevenue: type === "payment" ? amount : 0,
    transactionDate,
    stadiumName,
    fieldName,
    paymentMethod: booking.payment_method || null,
    refundReason: type === "refund" ? booking.refund_reason || null : null,
    userName: booking?.user?.name || null,
    userPhone: booking?.user?.phone || null,
    status: type === "refund" ? "refunded" : booking.payment_status || "paid",
  };
}

function buildPaymentHistoryTransactions(bookings) {
  const transactions = [];

  for (const booking of bookings) {
    if (hasPaymentTransaction(booking)) {
      transactions.push(
        createTransaction(booking, "payment", getPaymentTransactionDate(booking)),
      );
    }

    if (hasRefundTransaction(booking)) {
      transactions.push(createTransaction(booking, "refund", booking.refunded_at));
    }
  }

  return transactions.sort((left, right) => {
    return (
      parseRequiredDate(right.transactionDate, "transaction date") -
      parseRequiredDate(left.transactionDate, "transaction date")
    );
  });
}
```

- [ ] **Step 2: Export the helper API used by tests and controllers**

Ensure `backend/utils/paymentHistory.js` exports:
```javascript
module.exports = {
  buildPaymentHistoryTransactions,
  filterTransactionsByDateRange,
  getPaymentHistoryPage,
  hasPaymentTransaction,
  hasRefundTransaction,
  paginateTransactions,
  resolveHistoryFilters,
  toNumber,
};
```

- [ ] **Step 3: Run targeted backend tests**

Run: `node --test backend/tests/paymentHistory.test.js`
Expected: PASS for helper-focused assertions, while controller tests may still fail until controller summary shaping is updated.

- [ ] **Step 4: Commit helper fixes**

```bash
git add backend/utils/paymentHistory.js
git commit -m "feat: align payment history helper rules"
```

### Task 3: Complete Controller Summaries And Empty States

**Files:**
- Modify: `backend/controllers/bookingController.js`
- Test: `backend/tests/paymentHistory.test.js`

- [ ] **Step 1: Update summary calculation to use `refundAmount` for refunds**

Modify the summary helper in `backend/controllers/bookingController.js`
```javascript
function calculatePaymentHistorySummary(transactions) {
  const totalPayment = transactions
    .filter((transaction) => transaction.type === "payment")
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const totalRefund = transactions
    .filter((transaction) => transaction.type === "refund")
    .reduce((sum, transaction) => sum + toNumber(transaction.refundAmount), 0);

  return {
    totalPayment,
    totalRefund,
    netRevenue: totalPayment - totalRefund,
  };
}
```

- [ ] **Step 2: Keep user endpoint role-scoped and return shared summary**

Ensure `getUserPaymentHistory` returns:
```javascript
return res.status(200).json({
  success: true,
  transactions,
  total: filteredTransactions.length,
  hasMore: currentPage * safeLimit < filteredTransactions.length,
  currentPage,
  limit: safeLimit,
  summary: {
    totalPayment: summary.totalPayment,
    totalRefund: summary.totalRefund,
  },
});
```

- [ ] **Step 3: Keep owner endpoint stadium-scoped and return owner summary**

Ensure `getOwnerPaymentHistory` returns:
```javascript
return res.status(200).json({
  success: true,
  transactions,
  total: filteredTransactions.length,
  hasMore: currentPage * safeLimit < filteredTransactions.length,
  currentPage,
  limit: safeLimit,
  summary,
});
```

- [ ] **Step 4: Preserve the no-stadium empty success response for owners**

Keep this owner empty state in `backend/controllers/bookingController.js`
```javascript
if (stadiumIds.length === 0) {
  return res.status(200).json({
    success: true,
    transactions: [],
    total: 0,
    hasMore: false,
    currentPage,
    limit: safeLimit,
    summary: {
      totalPayment: 0,
      totalRefund: 0,
      netRevenue: 0,
    },
  });
}
```

- [ ] **Step 5: Run all backend tests**

Run in `backend`: `npm test`
Expected: PASS, including `backend/tests/paymentHistory.test.js`

- [ ] **Step 6: Commit controller changes**

```bash
git add backend/controllers/bookingController.js backend/tests/paymentHistory.test.js
git commit -m "feat: finalize payment history responses"
```

### Task 4: Keep Backend Routes Stable And Verified

**Files:**
- Modify: `backend/routes/bookingRoutes.js`

- [ ] **Step 1: Verify the fixed routes remain above wildcard `/:id`**

Ensure `backend/routes/bookingRoutes.js` contains:
```javascript
router.get(
  "/payment-history",
  verifyToken,
  bookingController.getUserPaymentHistory,
);
router.get(
  "/owner/payment-history",
  verifyToken,
  bookingController.getOwnerPaymentHistory,
);
```

- [ ] **Step 2: Keep legacy refund routes intact for admin and old owner page compatibility during rollout**

Ensure these routes still exist:
```javascript
router.get("/refund-history", verifyToken, bookingController.getRefundHistory);
router.get(
  "/admin/refund-history",
  verifyToken,
  bookingController.getAdminRefundHistory,
);
```

- [ ] **Step 3: Re-run backend tests**

Run in `backend`: `npm test`
Expected: PASS with no route-order regressions introduced by the review.

- [ ] **Step 4: Commit route verification if any edit was needed**

```bash
git add backend/routes/bookingRoutes.js
git commit -m "chore: verify payment history routes"
```

### Task 5: Build The Shared Frontend Payment History Page

**Files:**
- Create: `frontend/src/pages/PaymentHistory.jsx`
- Modify: `frontend/src/services/paymentHistoryService.js`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/MainLayout.jsx`

- [ ] **Step 1: Normalize the frontend service API**

Update `frontend/src/services/paymentHistoryService.js`
```javascript
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function getAuthHeaders() {
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const token = parsedUser?.token;

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildHistoryParams(filters = {}) {
  return {
    month: filters.month,
    year: filters.year,
    startDate: filters.startDate,
    endDate: filters.endDate,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };
}

export function buildCurrentMonthDefaultFilter() {
  const now = new Date();

  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear()),
    page: 1,
    limit: 10,
  };
}

export async function getUserPaymentHistory(filters = {}) {
  const response = await axios.get(`${API_URL}/bookings/payment-history`, {
    headers: getAuthHeaders(),
    params: buildHistoryParams(filters),
  });

  return response.data;
}

export async function getOwnerPaymentHistory(filters = {}) {
  const response = await axios.get(`${API_URL}/bookings/owner/payment-history`, {
    headers: getAuthHeaders(),
    params: buildHistoryParams(filters),
  });

  return response.data;
}
```

- [ ] **Step 2: Create the shared page**

Create `frontend/src/pages/PaymentHistory.jsx`
```javascript
import React, { useEffect, useState } from "react";
import {
  buildCurrentMonthDefaultFilter,
  getOwnerPaymentHistory,
  getUserPaymentHistory,
} from "../services/paymentHistoryService";

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}d`;
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Khong xac dinh";
}

export default function PaymentHistory() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const role = Number(stored?.user?.role_id || stored?.user?.role);
  const isOwner = role === 2;
  const [filters, setFilters] = useState(() => buildCurrentMonthDefaultFilter());
  const [payload, setPayload] = useState({
    transactions: [],
    total: 0,
    hasMore: false,
    currentPage: 1,
    limit: 10,
    summary: { totalPayment: 0, totalRefund: 0, netRevenue: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("month");

  async function loadHistory(nextFilters, append = false) {
    const request = isOwner ? getOwnerPaymentHistory : getUserPaymentHistory;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await request(nextFilters);
      setPayload((current) => ({
        ...response,
        transactions: append
          ? [...current.transactions, ...response.transactions]
          : response.transactions,
      }));
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadHistory(filters);
  }, []);

  function resetToCurrentMonth() {
    const nextFilters = buildCurrentMonthDefaultFilter();
    setMode("month");
    setFilters(nextFilters);
    loadHistory(nextFilters);
  }

  function handleDateSubmit(event) {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      page: 1,
      month: undefined,
      year: undefined,
    };
    setFilters(nextFilters);
    loadHistory(nextFilters);
  }

  function handleLoadMore() {
    const nextFilters = {
      ...filters,
      page: payload.currentPage + 1,
    };
    setFilters(nextFilters);
    loadHistory(nextFilters, true);
  }

  return (
    <div className="container mt-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            {isOwner ? "Lich su thanh toan cua san" : "Lich su thanh toan"}
          </h4>
          <div className="text-muted small">
            Bao gom ca giao dich thanh toan va hoan tien trong thang hien tai
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={resetToCurrentMonth}>
            Thang nay
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setMode("custom")}>
            Tuy chinh
          </button>
        </div>
      </div>

      {mode === "custom" && (
        <form className="card border-0 shadow-sm p-3 mb-4" onSubmit={handleDateSubmit}>
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label">Tu ngay</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate || ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, startDate: event.target.value }))
                }
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Den ngay</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate || ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, endDate: event.target.value }))
                }
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-dark w-100" type="submit">
                Loc
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="row g-3 mb-4">
        <div className={isOwner ? "col-md-4" : "col-md-6"}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Tong thanh toan</div>
              <div className="fs-4 fw-bold text-success">
                {formatMoney(payload.summary?.totalPayment)}
              </div>
            </div>
          </div>
        </div>
        <div className={isOwner ? "col-md-4" : "col-md-6"}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Tong hoan tien</div>
              <div className="fs-4 fw-bold text-danger">
                {formatMoney(payload.summary?.totalRefund)}
              </div>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Doanh thu thuc</div>
                <div className="fs-4 fw-bold text-primary">
                  {formatMoney(payload.summary?.netRevenue)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">Dang tai du lieu...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Ma don</th>
                  <th>San</th>
                  {isOwner && <th>Khach hang</th>}
                  <th>Loai</th>
                  <th>So tien</th>
                  <th>Phuong thuc</th>
                  <th>Ngay giao dich</th>
                </tr>
              </thead>
              <tbody>
                {payload.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner ? 7 : 6} className="text-center py-5 text-muted">
                      Chua co giao dich nao trong bo loc hien tai.
                    </td>
                  </tr>
                ) : (
                  payload.transactions.map((transaction, index) => (
                    <tr key={`${transaction.type}-${transaction.bookingId}-${index}`}>
                      <td className="ps-4 fw-semibold">#{transaction.bookingId}</td>
                      <td>
                        <div>{transaction.stadiumName || "Khong xac dinh"}</div>
                        <small className="text-muted">{transaction.fieldName || ""}</small>
                      </td>
                      {isOwner && (
                        <td>
                          <div>{transaction.userName || "Khong xac dinh"}</div>
                          <small className="text-muted">{transaction.userPhone || ""}</small>
                        </td>
                      )}
                      <td>
                        <span
                          className={`badge ${
                            transaction.type === "payment" ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {transaction.type === "payment" ? "Thanh toan" : "Hoan tien"}
                        </span>
                      </td>
                      <td
                        className={
                          transaction.type === "payment"
                            ? "text-success fw-bold"
                            : "text-danger fw-bold"
                        }
                      >
                        {transaction.type === "payment" ? "+" : "-"}
                        {formatMoney(
                          transaction.type === "payment"
                            ? transaction.amount
                            : transaction.refundAmount,
                        )}
                      </td>
                      <td>{transaction.paymentMethod || "Khong xac dinh"}</td>
                      <td>{formatDateTime(transaction.transactionDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && payload.hasMore && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-dark"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Dang tai..." : "Tai them"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Register the new user and owner routes**

Modify `frontend/src/App.jsx`
```javascript
import PaymentHistory from './pages/PaymentHistory';
import AdminRefundHistory from './pages/AdminRefundHistory';
```

Under the public `MainLayout` routes, add:
```javascript
<Route path="/payment-history" element={<PaymentHistory />} />
```

Under the owner `MainLayout` routes, replace:
```javascript
<Route path="/owner/refund-history" element={<RefundHistory />} />
```
with:
```javascript
<Route path="/owner/payment-history" element={<PaymentHistory />} />
```

- [ ] **Step 4: Update owner navigation label and destination**

Modify `frontend/src/components/MainLayout.jsx`
```javascript
<Link
  className="nav-link px-2"
  style={getLinkStyle('/owner/payment-history')}
  to="/owner/payment-history"
>
  <div className="d-flex align-items-center gap-1">
    <i className="bi bi-receipt text-success"></i>
    <span style={{ fontSize: '14px' }}>
      Lich su thanh toan
    </span>
  </div>
</Link>
```

- [ ] **Step 5: Run frontend validation**

Run in `frontend`: `npm run build`
Expected: PASS and `vite build` completes without route-import errors.

- [ ] **Step 6: Commit frontend payment history**

```bash
git add frontend/src/services/paymentHistoryService.js frontend/src/pages/PaymentHistory.jsx frontend/src/App.jsx frontend/src/components/MainLayout.jsx
git commit -m "feat: add shared payment history page"
```

### Task 6: Update Documentation And Verify End To End

**Files:**
- Modify: `docs/plans/planpaymenthistory.md`

- [ ] **Step 1: Sync the Vietnamese note with the approved scope**

Update `docs/plans/planpaymenthistory.md` so it states:
```markdown
- Owner xem toan bo lich su thanh toan va hoan tien cua cac san thuoc minh.
- User chi xem lich su thanh toan va hoan tien cua chinh minh.
- Man owner duoc doi tu refund-history sang payment-history.
- Admin refund-history giu nguyen trong pham vi hien tai.
```

- [ ] **Step 2: Run backend verification**

Run in `backend`: `npm test`
Expected: PASS.

- [ ] **Step 3: Run frontend verification**

Run in `frontend`: `npm run build`
Expected: PASS.

- [ ] **Step 4: Review changed files before closing**

Run:
```bash
git diff -- backend/utils/paymentHistory.js backend/controllers/bookingController.js backend/routes/bookingRoutes.js frontend/src/services/paymentHistoryService.js frontend/src/pages/PaymentHistory.jsx frontend/src/App.jsx frontend/src/components/MainLayout.jsx docs/plans/planpaymenthistory.md
```
Expected: Diff shows only payment-history-related changes and no accidental admin-route removal.

- [ ] **Step 5: Commit the documentation sync**

```bash
git add docs/plans/planpaymenthistory.md docs/plans/2026-05-13-payment-history-plan.md
git commit -m "docs: finalize payment history plan and notes"
```

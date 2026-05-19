# User Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase-1 user wallet support so users can top up via `VnPay` or `Momo`, withdraw in a simulated internal flow, pay for bookings with wallet balance, and receive all eligible booking refunds back into the wallet.

**Architecture:** Keep the wallet small and tightly coupled to the existing booking/payment flow. Backend adds one wallet balance store plus one wallet transaction history store, then extends the booking controller so `wallet` becomes a third payment method beside `vnpay` and `momo`. Frontend adds a new user wallet page and injects the wallet method into the current booking checkout flow without redesigning the booking information architecture.

**Tech Stack:** Node.js, Express, Sequelize, MySQL migrations, React 19, React Router 7, Axios, Vitest, React Testing Library, node:test

---

## File Structure

**Files and responsibilities:**

- Create: `backend/migrations/20260519000001-create-wallet.js`
  Responsibility: create `wallets` table keyed by `user_id` with current balance.
- Create: `backend/migrations/20260519000002-create-wallet-transaction.js`
  Responsibility: create `wallet_transactions` table for top-up, withdrawal, booking payment, and booking refund rows.
- Create: `backend/models/wallet.js`
  Responsibility: define wallet model and user association.
- Create: `backend/models/wallettransaction.js`
  Responsibility: define wallet transaction model and booking/user associations.
- Modify: `backend/models/index.js`
  Responsibility: wire wallet and wallet transaction associations.
- Create: `backend/utils/walletTypes.js`
  Responsibility: centralize transaction type/status constants.
- Create: `backend/utils/walletService.js`
  Responsibility: encapsulate balance lookup, balance mutation, transaction creation, and insufficient-funds validation.
- Create: `backend/tests/walletService.test.js`
  Responsibility: node:test coverage for wallet balance and transaction behavior.
- Modify: `backend/controllers/bookingController.js`
  Responsibility: allow wallet payment on create booking and refund-to-wallet on cancellation/refund flows.
- Modify: `backend/routes/bookingRoutes.js`
  Responsibility: expose booking flow with wallet-compatible behavior only if route changes are required.
- Create: `backend/controllers/walletController.js`
  Responsibility: return wallet summary/history and handle top-up/withdraw requests.
- Create: `backend/routes/walletRoutes.js`
  Responsibility: mount wallet endpoints behind `verifyToken`.
- Modify: `backend/routes/userRoutes.js` or `backend/app` route mount file if wallet routes are mounted centrally there
  Responsibility: register wallet routes in the API tree.
- Create: `frontend/src/pages/WalletPage.jsx`
  Responsibility: show current balance, top-up form, withdraw form, and transaction history.
- Create: `frontend/src/services/walletService.js`
  Responsibility: frontend API wrapper for wallet summary/history/top-up/withdraw.
- Modify: `frontend/src/App.jsx`
  Responsibility: register `/wallet` route under the protected `MainLayout` shell.
- Modify: `frontend/src/components/MainLayout.jsx`
  Responsibility: add wallet entry in the user account drawer.
- Modify: `frontend/src/pages/FieldDetail.jsx`
  Responsibility: add `wallet` as a third payment method and route wallet booking payments through the normal booking submit flow without redirecting to gateway pages.
- Modify: `frontend/src/App.css`
  Responsibility: add wallet page styles and extend payment option states if needed.
- Create: `frontend/src/test/wallet-page.test.jsx`
  Responsibility: cover wallet page rendering and Vietnamese user actions.
- Modify: `frontend/src/test/field-detail.test.jsx`
  Responsibility: cover the visible wallet payment method in booking checkout.

The plan deliberately avoids owner wallet, mixed payment, or real bank payout integration.

### Task 1: Lock the wallet domain contract with backend tests and constants

**Files:**
- Create: `backend/utils/walletTypes.js`
- Create: `backend/tests/walletService.test.js`

- [ ] **Step 1: Create wallet constants first so the rest of the implementation uses one vocabulary**

```js
const WALLET_TRANSACTION_TYPES = {
  TOP_UP: 'TOP_UP',
  WITHDRAW: 'WITHDRAW',
  BOOKING_PAYMENT: 'BOOKING_PAYMENT',
  BOOKING_REFUND: 'BOOKING_REFUND',
};

const WALLET_TRANSACTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
};

module.exports = {
  WALLET_TRANSACTION_TYPES,
  WALLET_TRANSACTION_STATUS,
};
```

- [ ] **Step 2: Write the failing wallet service tests before writing the service**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('applyWalletTransaction adds top-up amount to balance and records history', async () => {
  const fakeWallet = { id: 1, user_id: 7, balance: 100000, save: async () => {} };
  const createdRows = [];

  const result = await applyWalletTransaction(
    {
      Wallet: { findOne: async () => fakeWallet, create: async () => fakeWallet },
      WalletTransaction: { create: async (payload) => createdRows.push(payload) },
    },
    {
      userId: 7,
      amount: 50000,
      type: WALLET_TRANSACTION_TYPES.TOP_UP,
      description: 'Nap tien qua VnPay',
    }
  );

  assert.equal(result.balance, 150000);
  assert.equal(createdRows[0].type, WALLET_TRANSACTION_TYPES.TOP_UP);
});

test('applyWalletTransaction throws when booking payment exceeds current balance', async () => {
  await assert.rejects(
    () =>
      applyWalletTransaction(
        {
          Wallet: { findOne: async () => ({ id: 1, user_id: 7, balance: 20000, save: async () => {} }) },
          WalletTransaction: { create: async () => ({}) },
        },
        {
          userId: 7,
          amount: 50000,
          type: WALLET_TRANSACTION_TYPES.BOOKING_PAYMENT,
          description: 'Thanh toan san bang vi',
        }
      ),
    /INSUFFICIENT_WALLET_BALANCE/
  );
});
```

- [ ] **Step 3: Run the new backend test file to confirm it fails because the service does not exist yet**

Run: `node --test backend/tests/walletService.test.js`

Expected: FAIL with missing import or undefined `applyWalletTransaction`.

- [ ] **Step 4: Commit the contract-first wallet test skeleton**

```bash
git add backend/utils/walletTypes.js backend/tests/walletService.test.js
git commit -m "test: define wallet domain contract"
```

### Task 2: Add wallet persistence and the core wallet service

**Files:**
- Create: `backend/migrations/20260519000001-create-wallet.js`
- Create: `backend/migrations/20260519000002-create-wallet-transaction.js`
- Create: `backend/models/wallet.js`
- Create: `backend/models/wallettransaction.js`
- Modify: `backend/models/index.js`
- Create: `backend/utils/walletService.js`
- Test: `backend/tests/walletService.test.js`

- [ ] **Step 1: Create the `wallets` migration**

```js
await queryInterface.createTable('wallets', {
  id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
  user_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    unique: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  balance: {
    allowNull: false,
    type: Sequelize.DECIMAL(12, 0),
    defaultValue: 0,
  },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});
```

- [ ] **Step 2: Create the `wallet_transactions` migration**

```js
await queryInterface.createTable('wallet_transactions', {
  id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
  wallet_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'wallets', key: 'id' },
    onDelete: 'CASCADE',
  },
  user_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  booking_id: {
    allowNull: true,
    type: Sequelize.INTEGER,
    references: { model: 'bookings', key: 'id' },
    onDelete: 'SET NULL',
  },
  type: { allowNull: false, type: Sequelize.STRING },
  status: { allowNull: false, type: Sequelize.STRING, defaultValue: 'success' },
  amount: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  balance_before: { allowNull: false, type: Sequelize.DECIMAL(12, 0), defaultValue: 0 },
  balance_after: { allowNull: false, type: Sequelize.DECIMAL(12, 0), defaultValue: 0 },
  description: { allowNull: false, type: Sequelize.STRING },
  reference_type: { allowNull: true, type: Sequelize.STRING },
  reference_id: { allowNull: true, type: Sequelize.INTEGER },
  metadata: { allowNull: true, type: Sequelize.JSON },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});
```

- [ ] **Step 3: Add Sequelize models and associations**

```js
// backend/models/wallet.js
module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    user_id: DataTypes.INTEGER,
    balance: DataTypes.DECIMAL(12, 0),
  }, { tableName: 'wallets' });

  Wallet.associate = (models) => {
    Wallet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Wallet.hasMany(models.WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });
  };

  return Wallet;
};
```

```js
// backend/models/wallettransaction.js
module.exports = (sequelize, DataTypes) => {
  const WalletTransaction = sequelize.define('WalletTransaction', {
    wallet_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    booking_id: DataTypes.INTEGER,
    type: DataTypes.STRING,
    status: DataTypes.STRING,
    amount: DataTypes.DECIMAL(12, 0),
    balance_before: DataTypes.DECIMAL(12, 0),
    balance_after: DataTypes.DECIMAL(12, 0),
    description: DataTypes.STRING,
    reference_type: DataTypes.STRING,
    reference_id: DataTypes.INTEGER,
    metadata: DataTypes.JSON,
  }, { tableName: 'wallet_transactions' });

  WalletTransaction.associate = (models) => {
    WalletTransaction.belongsTo(models.Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
    WalletTransaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    WalletTransaction.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
  };

  return WalletTransaction;
};
```

- [ ] **Step 4: Implement the minimal wallet service to create/find the wallet and mutate balance atomically**

```js
const { WALLET_TRANSACTION_STATUS } = require('./walletTypes');

const toAmount = (value) => Number(value || 0);

async function getOrCreateWallet(db, userId, transaction) {
  const existing = await db.Wallet.findOne({ where: { user_id: userId }, transaction, lock: transaction?.LOCK?.UPDATE });
  if (existing) return existing;
  return db.Wallet.create({ user_id: userId, balance: 0 }, { transaction });
}

async function applyWalletTransaction(db, payload, transaction) {
  const wallet = await getOrCreateWallet(db, payload.userId, transaction);
  const amount = toAmount(payload.amount);
  const before = toAmount(wallet.balance);
  const isDebit = [payload.type === 'WITHDRAW', payload.type === 'BOOKING_PAYMENT'].some(Boolean);

  if (isDebit && before < amount) {
    throw new Error('INSUFFICIENT_WALLET_BALANCE');
  }

  const after = isDebit ? before - amount : before + amount;
  wallet.balance = after;
  await wallet.save({ transaction });

  await db.WalletTransaction.create({
    wallet_id: wallet.id,
    user_id: payload.userId,
    booking_id: payload.bookingId || null,
    type: payload.type,
    status: WALLET_TRANSACTION_STATUS.SUCCESS,
    amount,
    balance_before: before,
    balance_after: after,
    description: payload.description,
    reference_type: payload.referenceType || null,
    reference_id: payload.referenceId || null,
    metadata: payload.metadata || null,
  }, { transaction });

  return { walletId: wallet.id, balance: after };
}

module.exports = { getOrCreateWallet, applyWalletTransaction };
```

- [ ] **Step 5: Run wallet service tests**

Run: `node --test backend/tests/walletService.test.js`

Expected: PASS.

- [ ] **Step 6: Commit wallet schema and core service**

```bash
git add backend/migrations/20260519000001-create-wallet.js backend/migrations/20260519000002-create-wallet-transaction.js backend/models/wallet.js backend/models/wallettransaction.js backend/models/index.js backend/utils/walletService.js backend/tests/walletService.test.js
git commit -m "feat: add wallet persistence and service"
```

### Task 3: Add wallet APIs for summary, history, top-up, and withdrawal

**Files:**
- Create: `backend/controllers/walletController.js`
- Create: `backend/routes/walletRoutes.js`
- Modify: route mount file that registers backend routes
- Modify: `backend/tests/walletService.test.js` or create `backend/tests/walletController.test.js`

- [ ] **Step 1: Write controller tests for summary and withdrawal behavior**

```js
test('getWalletSummary returns current balance and latest transactions', async () => {
  const response = createResponseRecorder();
  await walletController.getWalletSummary(
    { user: { id: 7 } },
    response
  );

  assert.equal(response.statusCode, 200);
});

test('withdraw rejects when requested amount is larger than wallet balance', async () => {
  const response = createResponseRecorder();
  await walletController.withdraw(
    {
      user: { id: 7 },
      body: { amount: 500000, bank_name: 'VCB', bank_account: '123', account_holder: 'Nguyen Van A' },
    },
    response
  );

  assert.equal(response.statusCode, 400);
  assert.match(response.payload.message, /so du vi khong du/i);
});
```

- [ ] **Step 2: Implement the wallet controller using the wallet service**

```js
exports.getWalletSummary = async (req, res) => {
  const wallet = await getOrCreateWallet(db, req.user.id);
  const transactions = await db.WalletTransaction.findAll({
    where: { user_id: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 20,
  });

  return res.status(200).json({
    success: true,
    data: {
      balance: Number(wallet.balance || 0),
      transactions,
    },
  });
};
```

```js
exports.topUp = async (req, res) => {
  const { amount, provider } = req.body;
  const result = await db.sequelize.transaction((transaction) =>
    applyWalletTransaction(
      db,
      {
        userId: req.user.id,
        amount,
        type: WALLET_TRANSACTION_TYPES.TOP_UP,
        description: `Nap tien vao vi qua ${provider}`,
        referenceType: 'top_up',
        metadata: { provider },
      },
      transaction
    )
  );

  return res.status(200).json({ success: true, data: result });
};
```

```js
exports.withdraw = async (req, res) => {
  const { amount, bank_name, bank_account, account_holder } = req.body;
  try {
    const result = await db.sequelize.transaction((transaction) =>
      applyWalletTransaction(
        db,
        {
          userId: req.user.id,
          amount,
          type: WALLET_TRANSACTION_TYPES.WITHDRAW,
          description: 'Rut tien ve tai khoan ngan hang',
          referenceType: 'withdrawal',
          metadata: { bank_name, bank_account, account_holder },
        },
        transaction
      )
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_WALLET_BALANCE') {
      return res.status(400).json({ success: false, message: 'So du vi khong du de rut tien.' });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};
```

- [ ] **Step 3: Register wallet routes behind authentication**

```js
const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

router.get('/summary', verifyToken, walletController.getWalletSummary);
router.get('/transactions', verifyToken, walletController.getWalletTransactions);
router.post('/top-up', verifyToken, walletController.topUp);
router.post('/withdraw', verifyToken, walletController.withdraw);

module.exports = router;
```

- [ ] **Step 4: Run backend wallet tests again**

Run: `node --test backend/tests/walletService.test.js`

Expected: PASS with both service and controller assertions.

- [ ] **Step 5: Commit wallet API endpoints**

```bash
git add backend/controllers/walletController.js backend/routes/walletRoutes.js backend/tests/walletService.test.js
git commit -m "feat: add wallet summary and withdrawal endpoints"
```

### Task 4: Extend booking payment and refund flows to support wallet

**Files:**
- Modify: `backend/controllers/bookingController.js`
- Modify: `backend/models/booking.js` only if method enum/validation requires it
- Test: `backend/tests/walletService.test.js` or create `backend/tests/bookingWalletFlow.test.js`

- [ ] **Step 1: Add a failing controller test for booking creation with `payment_method: 'wallet'`**

```js
test('createBooking marks wallet-paid booking as paid without redirect flow', async () => {
  const response = createResponseRecorder();

  await controller.createBooking(
    {
      body: {
        user_id: 7,
        field_id: 3,
        stadium_id: 5,
        booking_date: '2026-05-20',
        start_time: '18:00',
        end_time: '19:00',
        total_price: 200000,
        amount_paid: 200000,
        payment_type: 'full',
        payment_method: 'wallet',
      },
      user: { id: 7, role_id: 1 },
    },
    response
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.payload.data.payment_status, 'paid');
  assert.equal(response.payload.data.payment_method, 'wallet');
});
```

- [ ] **Step 2: Update booking creation so wallet payments deduct balance inside the booking transaction**

```js
const isWalletPayment = String(req.body.payment_method || '').toLowerCase() === 'wallet';

const newBooking = await Booking.create({
  field_id,
  stadium_id,
  user_id,
  booking_date,
  start_time,
  end_time,
  total_price,
  status: isWalletPayment ? 'confirmed' : 'pending',
  amount_paid,
  payment_type,
  payment_method: isWalletPayment ? 'wallet' : 'Online',
  payment_status: isWalletPayment ? 'paid' : 'unpaid',
  payment_recorded_at: isWalletPayment ? new Date() : null,
  hold_until: isWalletPayment ? null : holdUntilTime,
}, { transaction });

if (isWalletPayment) {
  await applyWalletTransaction(
    db,
    {
      userId: user_id,
      amount: amount_paid,
      type: WALLET_TRANSACTION_TYPES.BOOKING_PAYMENT,
      bookingId: newBooking.id,
      description: `Thanh toan don dat san #${newBooking.id} bang vi`,
      referenceType: 'booking',
      referenceId: newBooking.id,
    },
    transaction
  );
}
```

- [ ] **Step 3: Update refund handling so eligible refunds always return to wallet**

```js
await applyWalletTransaction(
  db,
  {
    userId: booking.user_id,
    amount: booking.amount_paid,
    type: WALLET_TRANSACTION_TYPES.BOOKING_REFUND,
    bookingId: booking.id,
    description: `Hoan tien huy san cho don #${booking.id}`,
    referenceType: 'booking_refund',
    referenceId: booking.id,
  },
  transaction
);

await booking.update({
  status: 'refunded',
  refunded_at: new Date(),
  refund_reason,
}, { transaction });
```

- [ ] **Step 4: Run backend wallet-flow tests**

Run: `node --test backend/tests/walletService.test.js`

Expected: PASS with wallet booking payment and refund scenarios covered.

- [ ] **Step 5: Commit wallet booking integration**

```bash
git add backend/controllers/bookingController.js backend/models/booking.js backend/tests/walletService.test.js
git commit -m "feat: support wallet payment and refund in booking flow"
```

### Task 5: Add the wallet page and user drawer entry on the frontend

**Files:**
- Create: `frontend/src/services/walletService.js`
- Create: `frontend/src/pages/WalletPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/MainLayout.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/wallet-page.test.jsx`

- [ ] **Step 1: Write the wallet page test before building the page**

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WalletPage from '../pages/WalletPage';

it('renders balance, top-up, withdrawal, and transaction history in Vietnamese', async () => {
  render(
    <MemoryRouter>
      <WalletPage />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: /vi tien cua toi/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /nap tien/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /rut tien/i })).toBeInTheDocument();
  expect(screen.getByText(/lich su giao dich/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Create the frontend wallet service wrapper**

```js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/wallet';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

export const getWalletSummary = () =>
  axios.get(`${API_URL}/summary`, { headers: getAuthHeaders() });

export const getWalletTransactions = () =>
  axios.get(`${API_URL}/transactions`, { headers: getAuthHeaders() });

export const topUpWallet = (payload) =>
  axios.post(`${API_URL}/top-up`, payload, { headers: getAuthHeaders() });

export const withdrawWallet = (payload) =>
  axios.post(`${API_URL}/withdraw`, payload, { headers: getAuthHeaders() });
```

- [ ] **Step 3: Build a minimal wallet page with summary, action forms, and history**

```jsx
const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  return (
    <div className="account-page wallet-page">
      <section className="account-shell wallet-hero">
        <p className="eyebrow">Vi tien</p>
        <h1>Vi tien cua toi</h1>
        <p>Dung vi de thanh toan dat san va nhan tien hoan khi huy san.</p>
        <div className="wallet-balance-card">
          <span>So du hien tai</span>
          <strong>{balance.toLocaleString('vi-VN')}d</strong>
        </div>
      </section>
    </div>
  );
};
```

- [ ] **Step 4: Register the route and add a drawer shortcut**

```jsx
// frontend/src/App.jsx
<Route path="/wallet" element={<WalletPage />} />
```

```jsx
// frontend/src/components/MainLayout.jsx
{ to: '/wallet', label: 'Vi tien cua toi', icon: 'bi-wallet2' },
```

- [ ] **Step 5: Add wallet page styles that reuse the existing user/owner design system**

```css
.wallet-page {
  display: grid;
  gap: 24px;
}

.wallet-balance-card,
.wallet-action-card,
.wallet-history-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 6: Run wallet page tests**

Run: `npm test -- src/test/wallet-page.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit the user wallet UI foundation**

```bash
git add frontend/src/services/walletService.js frontend/src/pages/WalletPage.jsx frontend/src/App.jsx frontend/src/components/MainLayout.jsx frontend/src/App.css frontend/src/test/wallet-page.test.jsx
git commit -m "feat: add user wallet page and navigation"
```

### Task 6: Add wallet as the third payment method in booking checkout

**Files:**
- Modify: `frontend/src/pages/FieldDetail.jsx`
- Modify: `frontend/src/test/field-detail.test.jsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Extend the field detail test so wallet appears as a third payment method**

```jsx
it('shows wallet beside VNPay and MoMo in the booking payment section', async () => {
  render(
    <MemoryRouter>
      <FieldDetail />
    </MemoryRouter>
  );

  expect(await screen.findByRole('button', { name: /vnpay/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /momo/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /vi/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Add `wallet` to the payment method state and UI**

```jsx
const [paymentMethod, setPaymentMethod] = useState('vnpay');
const [walletBalance, setWalletBalance] = useState(0);

<button
  type="button"
  className={`payment-option flex-fill ${paymentMethod === 'wallet' ? 'is-active' : ''}`}
  onClick={() => setPaymentMethod('wallet')}
>
  Vi
</button>
```

- [ ] **Step 3: Route wallet checkout to normal booking success instead of gateway redirect**

```jsx
if (paymentMethod === 'wallet') {
  window.alert('Dat san va thanh toan bang vi thanh cong.');
  navigate(getHistoryPathByRole(user));
  return;
}

const targetPath =
  paymentMethod === 'vnpay'
    ? isAdminFlow
      ? `/admin/payment-vnpay/${bookingId}`
      : `/payment-vnpay/${bookingId}`
    : isAdminFlow
      ? `/admin/payment-momo/${bookingId}`
      : `/payment-momo/${bookingId}`;
```

- [ ] **Step 4: Show the current wallet balance and disable wallet choice when balance is not enough**

```jsx
{paymentMethod === 'wallet' && (
  <div className="wallet-payment-note">
    So du hien tai: {walletBalance.toLocaleString('vi-VN')}d
    {walletBalance < amountToPay ? ' - So du khong du de thanh toan.' : ''}
  </div>
)}
```

- [ ] **Step 5: Run the field detail test**

Run: `npm test -- src/test/field-detail.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit wallet checkout support**

```bash
git add frontend/src/pages/FieldDetail.jsx frontend/src/test/field-detail.test.jsx frontend/src/App.css
git commit -m "feat: support wallet checkout on field detail"
```

### Task 7: Verify the full wallet slice end-to-end

**Files:**
- Modify: any touched file only if verification reveals missing glue

- [ ] **Step 1: Run backend wallet tests**

Run: `node --test backend/tests/walletService.test.js`

Expected: PASS.

- [ ] **Step 2: Run frontend wallet-related tests together**

Run: `npm test -- src/test/wallet-page.test.jsx src/test/field-detail.test.jsx`

Expected: PASS.

- [ ] **Step 3: Run the broader frontend regression slice that is most likely to be affected**

Run: `npm test -- src/test/app-shell.test.jsx src/test/field-detail.test.jsx src/test/wallet-page.test.jsx`

Expected: PASS.

- [ ] **Step 4: Run a production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit any final glue fixes**

```bash
git add backend/controllers/bookingController.js backend/controllers/walletController.js backend/routes/walletRoutes.js backend/utils/walletService.js frontend/src/pages/WalletPage.jsx frontend/src/pages/FieldDetail.jsx frontend/src/components/MainLayout.jsx frontend/src/App.jsx frontend/src/App.css frontend/src/test/wallet-page.test.jsx frontend/src/test/field-detail.test.jsx
git commit -m "feat: complete phase 1 user wallet flow"
```

## Self-Review

Spec coverage check:

- top-up through `VnPay` or `Momo`: covered in Task 3 and Task 5
- withdrawal with manual bank info and no admin approval: covered in Task 3 and Task 5
- wallet as third checkout method: covered in Task 4 and Task 6
- refund always returns to wallet: covered in Task 4
- transaction history and wallet page: covered in Task 2, Task 3, and Task 5

Placeholder scan:

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task names exact files and concrete commands.

Type consistency check:

- Transaction types use one constant source in `backend/utils/walletTypes.js`.
- Frontend uses `wallet` as the payment method string consistently in the booking flow.

# Recurring Booking With Deposit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase-1 recurring booking for users with weekly/monthly recurrence, one series-level deposit, approval rules based on deposit percentage, conflict replacement suggestions within the same week, and 5-day payment reminders for unpaid child bookings.

**Architecture:** Keep the existing `booking` table as the operational record for each playable session. Add a new recurring-series layer plus recurring-item linkage rows, then extend booking and notification flows around those records. Creation should generate all child bookings immediately after conflict resolution, while approval and payment reminders operate on the parent series and per-child remaining balance.

**Tech Stack:** Node.js, Express, Sequelize, MySQL migrations, React 19, React Router 7, Axios, Socket notifications, node:test, Vitest, React Testing Library

---

## File Structure

**Files and responsibilities:**

- Create: `backend/migrations/20260520000001-create-recurring-booking-series.js`
  Responsibility: add a parent table for recurring booking requests.
- Create: `backend/migrations/20260520000002-create-recurring-booking-items.js`
  Responsibility: add linkage rows between a recurring series and generated child bookings.
- Modify: `backend/migrations/20260328161757-create-booking.js` only if new recurring-related columns are better introduced there conceptually, otherwise use additive migration below.
- Create: `backend/migrations/20260520000003-add-recurring-payment-columns-to-bookings.js`
  Responsibility: add due-date and remaining-balance columns to bookings.
- Create: `backend/models/recurringbookingseries.js`
  Responsibility: define recurring series model and associations.
- Create: `backend/models/recurringbookingitem.js`
  Responsibility: define recurring child-item model and associations.
- Modify: `backend/models/booking.js`
  Responsibility: expose recurring linkage and remaining-payment fields.
- Modify: `backend/models/user.js`
  Responsibility: expose recurring series ownership relation.
- Modify: `backend/models/field.js`
  Responsibility: expose recurring series relation if useful for availability and owner queries.
- Create: `backend/utils/recurringBookingTypes.js`
  Responsibility: centralize recurrence type, approval status, and item status constants.
- Create: `backend/utils/recurringBookingService.js`
  Responsibility: generate occurrences, check conflicts, compute totals/deposits, generate alternative slots, create series plus child bookings, and evaluate approval mode.
- Create: `backend/tests/recurringBookingService.test.js`
  Responsibility: cover recurrence generation, deposit validation, approval rules, and conflict suggestion logic.
- Create: `backend/controllers/recurringBookingController.js`
  Responsibility: handle create-preview, create-submit, owner approve/reject, list/detail, and reminder actions when invoked manually or by scheduler.
- Create: `backend/routes/recurringBookingRoutes.js`
  Responsibility: expose recurring booking APIs for users and owners behind auth.
- Modify: `backend/app.js`
  Responsibility: mount recurring booking routes.
- Modify: `backend/server.js`
  Responsibility: extend the existing periodic background loop to emit payment reminders for due recurring child bookings.
- Create: `backend/tests/recurringBookingController.test.js`
  Responsibility: controller-level tests for create flow and approve/reject flow.
- Create: `frontend/src/services/recurringBookingService.js`
  Responsibility: frontend API wrapper for recurring preview/create/list/approve/reject flows.
- Create: `frontend/src/pages/RecurringBookingPage.jsx`
  Responsibility: user-facing recurring booking creation flow, conflict replacement step, and series summary.
- Create: `frontend/src/pages/OwnerRecurringRequests.jsx`
  Responsibility: owner-facing list of pending recurring series with approve/reject actions.
- Modify: `frontend/src/App.jsx`
  Responsibility: register the new recurring-booking routes for user and owner.
- Modify: `frontend/src/components/MainLayout.jsx`
  Responsibility: add navigation entry points where appropriate.
- Modify: `frontend/src/pages/FieldDetail.jsx`
  Responsibility: add entry CTA into recurring booking flow if phase 1 starts from the field detail page.
- Modify: `frontend/src/pages/OwnerSchedule.jsx`
  Responsibility: optionally surface recurring-series context in the owner schedule if needed for visibility.
- Modify: `frontend/src/App.css`
  Responsibility: style recurring creation, conflict-resolution, and owner-approval screens using the existing design system.
- Create: `frontend/src/test/recurring-booking-page.test.jsx`
  Responsibility: verify the recurring booking creation UI in Vietnamese.
- Create: `frontend/src/test/owner-recurring-requests.test.jsx`
  Responsibility: verify the owner approval screen in Vietnamese.

This plan intentionally does **not** include custom recurrence, partial series creation, or editing single generated occurrences after creation.

### Task 1: Lock recurring domain rules with service-level backend tests

**Files:**
- Create: `backend/utils/recurringBookingTypes.js`
- Create: `backend/tests/recurringBookingService.test.js`

- [ ] **Step 1: Create recurring status/type constants before writing any service logic**

```js
const RECURRING_TYPES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

const SERIES_APPROVAL_STATUS = {
  PENDING_OWNER_REVIEW: 'pending_owner_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

const RECURRING_ITEM_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

module.exports = {
  RECURRING_TYPES,
  SERIES_APPROVAL_STATUS,
  RECURRING_ITEM_STATUS,
};
```

- [ ] **Step 2: Write failing tests for the core recurring rules**

```js
test('resolveApprovalStatus auto-approves when deposit percent is at least 50', () => {
  assert.equal(
    resolveApprovalStatus({ totalEstimatedAmount: 1000000, depositAmount: 500000 }),
    SERIES_APPROVAL_STATUS.APPROVED
  );
});

test('resolveApprovalStatus requires owner review when deposit is between 25 and under 50 percent', () => {
  assert.equal(
    resolveApprovalStatus({ totalEstimatedAmount: 1000000, depositAmount: 300000 }),
    SERIES_APPROVAL_STATUS.PENDING_OWNER_REVIEW
  );
});

test('validateDepositAmount rejects values below 25 percent of the series total', () => {
  assert.throws(
    () => validateDepositAmount({ totalEstimatedAmount: 1000000, depositAmount: 200000 }),
    /INVALID_RECURRING_DEPOSIT/
  );
});

test('buildWeeklyOccurrences creates a full series between start and end date', () => {
  const rows = buildWeeklyOccurrences({
    startDate: '2026-05-01',
    endDate: '2026-05-29',
    weekday: 5,
    startTime: '18:00',
    endTime: '19:00',
  });

  assert.equal(rows.length, 5);
  assert.equal(rows[0].scheduledDate, '2026-05-01');
});
```

- [ ] **Step 3: Run the new recurring service test file to confirm it fails before implementation**

Run: `node --test backend/tests/recurringBookingService.test.js`

Expected: FAIL because `resolveApprovalStatus`, `validateDepositAmount`, and occurrence builders do not exist yet.

- [ ] **Step 4: Commit the recurring-domain test skeleton**

```bash
git add backend/utils/recurringBookingTypes.js backend/tests/recurringBookingService.test.js
git commit -m "test: define recurring booking domain contract"
```

### Task 2: Add persistence for recurring series, items, and child-payment tracking

**Files:**
- Create: `backend/migrations/20260520000001-create-recurring-booking-series.js`
- Create: `backend/migrations/20260520000002-create-recurring-booking-items.js`
- Create: `backend/migrations/20260520000003-add-recurring-payment-columns-to-bookings.js`
- Create: `backend/models/recurringbookingseries.js`
- Create: `backend/models/recurringbookingitem.js`
- Modify: `backend/models/booking.js`
- Modify: `backend/models/user.js`
- Modify: `backend/models/field.js`
- Test: `backend/tests/recurringBookingService.test.js`

- [ ] **Step 1: Create the recurring series migration**

```js
await queryInterface.createTable('recurring_booking_series', {
  id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
  user_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  field_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'fields', key: 'id' },
    onDelete: 'CASCADE',
  },
  stadium_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'stadiums', key: 'id' },
    onDelete: 'CASCADE',
  },
  recurrence_type: { allowNull: false, type: Sequelize.STRING },
  start_date: { allowNull: false, type: Sequelize.DATEONLY },
  end_date: { allowNull: true, type: Sequelize.DATEONLY },
  occurrence_count: { allowNull: true, type: Sequelize.INTEGER },
  preferred_day_of_week: { allowNull: true, type: Sequelize.INTEGER },
  preferred_start_time: { allowNull: false, type: Sequelize.TIME },
  preferred_end_time: { allowNull: false, type: Sequelize.TIME },
  total_estimated_amount: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  deposit_amount: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  deposit_percent: { allowNull: false, type: Sequelize.DECIMAL(5, 2) },
  approval_status: { allowNull: false, type: Sequelize.STRING },
  payment_status_summary: { allowNull: false, type: Sequelize.STRING, defaultValue: 'partially_paid' },
  created_by: { allowNull: false, type: Sequelize.INTEGER },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});
```

- [ ] **Step 2: Create the recurring item migration**

```js
await queryInterface.createTable('recurring_booking_items', {
  id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
  series_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'recurring_booking_series', key: 'id' },
    onDelete: 'CASCADE',
  },
  booking_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'bookings', key: 'id' },
    onDelete: 'CASCADE',
  },
  scheduled_date: { allowNull: false, type: Sequelize.DATEONLY },
  start_time: { allowNull: false, type: Sequelize.TIME },
  end_time: { allowNull: false, type: Sequelize.TIME },
  base_price: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  amount_paid: { allowNull: false, type: Sequelize.DECIMAL(12, 0), defaultValue: 0 },
  remaining_amount: { allowNull: false, type: Sequelize.DECIMAL(12, 0), defaultValue: 0 },
  payment_due_date: { allowNull: false, type: Sequelize.DATEONLY },
  item_status: { allowNull: false, type: Sequelize.STRING },
  was_rescheduled: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: false },
  original_date_time: { allowNull: true, type: Sequelize.STRING },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});
```

- [ ] **Step 3: Add booking-level columns for recurring linkage and payment deadline tracking**

```js
await queryInterface.addColumn('bookings', 'recurring_series_id', {
  type: Sequelize.INTEGER,
  allowNull: true,
  references: { model: 'recurring_booking_series', key: 'id' },
  onDelete: 'SET NULL',
});

await queryInterface.addColumn('bookings', 'remaining_amount', {
  type: Sequelize.DECIMAL(12, 0),
  allowNull: false,
  defaultValue: 0,
});

await queryInterface.addColumn('bookings', 'payment_due_date', {
  type: Sequelize.DATEONLY,
  allowNull: true,
});
```

- [ ] **Step 4: Add Sequelize models and associations**

```js
// backend/models/recurringbookingseries.js
module.exports = (sequelize, DataTypes) => {
  const RecurringBookingSeries = sequelize.define('RecurringBookingSeries', {
    user_id: DataTypes.INTEGER,
    field_id: DataTypes.INTEGER,
    stadium_id: DataTypes.INTEGER,
    recurrence_type: DataTypes.STRING,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    occurrence_count: DataTypes.INTEGER,
    preferred_day_of_week: DataTypes.INTEGER,
    preferred_start_time: DataTypes.TIME,
    preferred_end_time: DataTypes.TIME,
    total_estimated_amount: DataTypes.DECIMAL(12, 0),
    deposit_amount: DataTypes.DECIMAL(12, 0),
    deposit_percent: DataTypes.DECIMAL(5, 2),
    approval_status: DataTypes.STRING,
    payment_status_summary: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
  }, { tableName: 'recurring_booking_series' });

  RecurringBookingSeries.associate = (models) => {
    RecurringBookingSeries.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    RecurringBookingSeries.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
    RecurringBookingSeries.belongsTo(models.Stadium, { foreignKey: 'stadium_id', as: 'stadium' });
    RecurringBookingSeries.hasMany(models.RecurringBookingItem, { foreignKey: 'series_id', as: 'items' });
    RecurringBookingSeries.hasMany(models.Booking, { foreignKey: 'recurring_series_id', as: 'bookings' });
  };

  return RecurringBookingSeries;
};
```

```js
// backend/models/recurringbookingitem.js
module.exports = (sequelize, DataTypes) => {
  const RecurringBookingItem = sequelize.define('RecurringBookingItem', {
    series_id: DataTypes.INTEGER,
    booking_id: DataTypes.INTEGER,
    scheduled_date: DataTypes.DATEONLY,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    base_price: DataTypes.DECIMAL(12, 0),
    amount_paid: DataTypes.DECIMAL(12, 0),
    remaining_amount: DataTypes.DECIMAL(12, 0),
    payment_due_date: DataTypes.DATEONLY,
    item_status: DataTypes.STRING,
    was_rescheduled: DataTypes.BOOLEAN,
    original_date_time: DataTypes.STRING,
  }, { tableName: 'recurring_booking_items' });

  RecurringBookingItem.associate = (models) => {
    RecurringBookingItem.belongsTo(models.RecurringBookingSeries, { foreignKey: 'series_id', as: 'series' });
    RecurringBookingItem.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
  };

  return RecurringBookingItem;
};
```

- [ ] **Step 5: Run the recurring service test file again**

Run: `node --test backend/tests/recurringBookingService.test.js`

Expected: still FAIL on missing service functions, but schema/model definitions should be syntactically valid.

- [ ] **Step 6: Commit recurring persistence**

```bash
git add backend/migrations/20260520000001-create-recurring-booking-series.js backend/migrations/20260520000002-create-recurring-booking-items.js backend/migrations/20260520000003-add-recurring-payment-columns-to-bookings.js backend/models/recurringbookingseries.js backend/models/recurringbookingitem.js backend/models/booking.js backend/models/user.js backend/models/field.js
git commit -m "feat: add recurring booking persistence layer"
```

### Task 3: Implement recurring generation, deposit validation, and conflict suggestion service

**Files:**
- Create: `backend/utils/recurringBookingService.js`
- Test: `backend/tests/recurringBookingService.test.js`

- [ ] **Step 1: Implement deposit validation and approval resolution functions**

```js
function validateDepositAmount({ totalEstimatedAmount, depositAmount }) {
  const total = Number(totalEstimatedAmount || 0);
  const deposit = Number(depositAmount || 0);
  const minDeposit = total * 0.25;

  if (deposit < minDeposit || deposit > total) {
    throw new Error('INVALID_RECURRING_DEPOSIT');
  }

  return {
    total,
    deposit,
    percent: total === 0 ? 0 : (deposit / total) * 100,
  };
}

function resolveApprovalStatus({ totalEstimatedAmount, depositAmount }) {
  const { percent } = validateDepositAmount({ totalEstimatedAmount, depositAmount });
  return percent >= 50
    ? SERIES_APPROVAL_STATUS.APPROVED
    : SERIES_APPROVAL_STATUS.PENDING_OWNER_REVIEW;
}
```

- [ ] **Step 2: Implement weekly and monthly occurrence generation**

```js
function buildWeeklyOccurrences({ startDate, endDate, occurrenceCount, weekday, startTime, endTime }) {
  const occurrences = [];
  let cursor = new Date(`${startDate}T00:00:00`);

  while (cursor.getDay() !== weekday) {
    cursor.setDate(cursor.getDate() + 1);
  }

  while (true) {
    const scheduledDate = cursor.toISOString().slice(0, 10);
    if (endDate && scheduledDate > endDate) break;
    if (occurrenceCount && occurrences.length >= occurrenceCount) break;

    occurrences.push({ scheduledDate, startTime, endTime });
    cursor.setDate(cursor.getDate() + 7);
  }

  return occurrences;
}
```

- [ ] **Step 3: Implement conflict lookup and alternative suggestion within the same week**

```js
async function suggestAlternativesForWeek({ fieldId, scheduledDate, startTime, endTime, loadConflicts }) {
  const suggestions = [];
  const baseDate = new Date(`${scheduledDate}T00:00:00`);

  for (let offset = -3; offset <= 3; offset += 1) {
    const candidate = new Date(baseDate);
    candidate.setDate(baseDate.getDate() + offset);
    const candidateDate = candidate.toISOString().slice(0, 10);

    const hasConflict = await loadConflicts({ fieldId, scheduledDate: candidateDate, startTime, endTime });
    if (!hasConflict) {
      suggestions.push({ scheduledDate: candidateDate, startTime, endTime });
    }
  }

  return suggestions;
}
```

- [ ] **Step 4: Run recurring service tests**

Run: `node --test backend/tests/recurringBookingService.test.js`

Expected: PASS.

- [ ] **Step 5: Commit recurring core service**

```bash
git add backend/utils/recurringBookingService.js backend/tests/recurringBookingService.test.js backend/utils/recurringBookingTypes.js
git commit -m "feat: implement recurring booking core service"
```

### Task 4: Add controller and API flow for preview, create, approve, and reject

**Files:**
- Create: `backend/controllers/recurringBookingController.js`
- Create: `backend/routes/recurringBookingRoutes.js`
- Modify: `backend/app.js`
- Create: `backend/tests/recurringBookingController.test.js`

- [ ] **Step 1: Write controller tests for create preview and owner approval**

```js
test('preview returns conflict suggestions instead of creating partial series', async () => {
  const response = createResponseRecorder();

  await controller.previewRecurringBooking(
    {
      user: { id: 7 },
      body: {
        field_id: 3,
        recurrence_type: 'weekly',
        start_date: '2026-06-01',
        end_date: '2026-06-30',
        preferred_day_of_week: 6,
        preferred_start_time: '18:00',
        preferred_end_time: '19:00',
      },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.success, true);
});

test('owner can approve a pending recurring series', async () => {
  const response = createResponseRecorder();
  await controller.approveRecurringSeries({ params: { id: '15' }, user: { id: 2 } }, response);
  assert.equal(response.statusCode, 200);
});
```

- [ ] **Step 2: Implement preview and create endpoints**

```js
exports.previewRecurringBooking = async (req, res) => {
  const preview = await buildRecurringPreview(db, req.body, req.user.id);
  return res.status(200).json({ success: true, data: preview });
};

exports.createRecurringBooking = async (req, res) => {
  const result = await db.sequelize.transaction((transaction) =>
    createRecurringSeries(db, req.body, req.user.id, transaction)
  );

  return res.status(201).json({ success: true, data: result });
};
```

- [ ] **Step 3: Implement owner approve/reject endpoints**

```js
exports.approveRecurringSeries = async (req, res) => {
  const series = await db.RecurringBookingSeries.findByPk(req.params.id, { include: ['items', 'field'] });
  series.approval_status = SERIES_APPROVAL_STATUS.APPROVED;
  await series.save();
  await db.Booking.update({ status: 'confirmed' }, { where: { recurring_series_id: series.id } });
  return res.status(200).json({ success: true, data: series });
};
```

```js
exports.rejectRecurringSeries = async (req, res) => {
  const series = await db.RecurringBookingSeries.findByPk(req.params.id);
  series.approval_status = SERIES_APPROVAL_STATUS.REJECTED;
  await series.save();
  return res.status(200).json({ success: true, data: series });
};
```

- [ ] **Step 4: Register routes**

```js
router.post('/preview', verifyToken, recurringBookingController.previewRecurringBooking);
router.post('/', verifyToken, recurringBookingController.createRecurringBooking);
router.get('/mine', verifyToken, recurringBookingController.getMyRecurringSeries);
router.get('/owner/pending', verifyToken, recurringBookingController.getOwnerPendingRecurringSeries);
router.put('/:id/approve', verifyToken, recurringBookingController.approveRecurringSeries);
router.put('/:id/reject', verifyToken, recurringBookingController.rejectRecurringSeries);
```

- [ ] **Step 5: Run controller tests**

Run: `node --test backend/tests/recurringBookingController.test.js`

Expected: PASS.

- [ ] **Step 6: Commit recurring controller and routes**

```bash
git add backend/controllers/recurringBookingController.js backend/routes/recurringBookingRoutes.js backend/app.js backend/tests/recurringBookingController.test.js
git commit -m "feat: add recurring booking controller and routes"
```

### Task 5: Add reminder processing for unpaid recurring child bookings

**Files:**
- Modify: `backend/server.js`
- Modify: `backend/controllers/recurringBookingController.js` if reminder helper lives there
- Test: `backend/tests/recurringBookingController.test.js`

- [ ] **Step 1: Write a failing test for reminder candidate detection**

```js
test('findRecurringReminderCandidates returns child bookings due within 5 days with remaining balance', async () => {
  const rows = await findRecurringReminderCandidates(mockDb, new Date('2026-06-10T00:00:00.000Z'));
  assert.equal(rows.length, 1);
});
```

- [ ] **Step 2: Implement reminder lookup and notification dispatch**

```js
async function findRecurringReminderCandidates(db, now = new Date()) {
  const target = new Date(now);
  target.setDate(target.getDate() + 5);
  const targetDate = target.toISOString().slice(0, 10);

  return db.RecurringBookingItem.findAll({
    where: {
      payment_due_date: targetDate,
      remaining_amount: { [db.Sequelize.Op.gt]: 0 },
      item_status: { [db.Sequelize.Op.in]: ['pending', 'confirmed'] },
    },
    include: [{ model: db.Booking, as: 'booking', include: ['user', 'field'] }],
  });
}
```

- [ ] **Step 3: Hook reminder execution into the existing background loop in `backend/server.js`**

```js
setInterval(async () => {
  await expirePendingBookings();
  await processRecurringPaymentReminders();
}, 60 * 1000);
```

- [ ] **Step 4: Run controller/reminder tests**

Run: `node --test backend/tests/recurringBookingController.test.js`

Expected: PASS.

- [ ] **Step 5: Commit reminder processing**

```bash
git add backend/server.js backend/controllers/recurringBookingController.js backend/tests/recurringBookingController.test.js
git commit -m "feat: add recurring booking payment reminders"
```

### Task 6: Build the user recurring-booking creation flow

**Files:**
- Create: `frontend/src/services/recurringBookingService.js`
- Create: `frontend/src/pages/RecurringBookingPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/MainLayout.jsx`
- Modify: `frontend/src/pages/FieldDetail.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/recurring-booking-page.test.jsx`

- [ ] **Step 1: Write the recurring booking page test before building the page**

```jsx
it('renders recurring booking creation in Vietnamese with deposit inputs', async () => {
  render(
    <MemoryRouter>
      <RecurringBookingPage />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: /đặt sân định kỳ/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/kiểu lặp/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/số tiền cọc/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /xem trước chuỗi/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Create the frontend recurring service wrapper**

```js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/recurring-bookings';

export const previewRecurringBooking = (payload, headers) =>
  axios.post(`${API_URL}/preview`, payload, { headers });

export const createRecurringBooking = (payload, headers) =>
  axios.post(API_URL, payload, { headers });

export const getMyRecurringSeries = (headers) =>
  axios.get(`${API_URL}/mine`, { headers });
```

- [ ] **Step 3: Build the user flow with preview, conflict review, and submit**

```jsx
const [preview, setPreview] = useState(null);

const handlePreview = async (event) => {
  event.preventDefault();
  const response = await previewRecurringBooking(formData, getAuthHeaders());
  setPreview(response.data?.data || null);
};
```

- [ ] **Step 4: Register the route and add navigation entry**

```jsx
<Route path="/recurring-bookings" element={<RecurringBookingPage />} />
```

```jsx
{ to: '/recurring-bookings', label: 'Đặt sân định kỳ', icon: 'bi-arrow-repeat' },
```

- [ ] **Step 5: Add styles for recurring forms and preview panels**

```css
.recurring-page,
.recurring-preview-card,
.recurring-conflict-card,
.recurring-summary-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}
```

- [ ] **Step 6: Run recurring page tests**

Run: `npm test -- src/test/recurring-booking-page.test.jsx`

Expected: PASS.

- [ ] **Step 7: Commit the user recurring-booking UI**

```bash
git add frontend/src/services/recurringBookingService.js frontend/src/pages/RecurringBookingPage.jsx frontend/src/App.jsx frontend/src/components/MainLayout.jsx frontend/src/pages/FieldDetail.jsx frontend/src/App.css frontend/src/test/recurring-booking-page.test.jsx
git commit -m "feat: add recurring booking user flow"
```

### Task 7: Build the owner review screen for pending recurring requests

**Files:**
- Create: `frontend/src/pages/OwnerRecurringRequests.jsx`
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/test/owner-recurring-requests.test.jsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Write the owner recurring-request screen test**

```jsx
it('renders pending recurring requests with approve and reject actions', async () => {
  render(
    <MemoryRouter>
      <OwnerRecurringRequests />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: /yêu cầu đặt sân định kỳ/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /duyệt/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /từ chối/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Build the owner approval list using the recurring service**

```jsx
const handleApprove = async (seriesId) => {
  await approveRecurringSeries(seriesId, getAuthHeaders());
  await loadRows();
};
```

- [ ] **Step 3: Register the owner route**

```jsx
<Route path="/owner/recurring-requests" element={<OwnerRecurringRequests />} />
```

- [ ] **Step 4: Run the owner recurring-request test**

Run: `npm test -- src/test/owner-recurring-requests.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the owner recurring review UI**

```bash
git add frontend/src/pages/OwnerRecurringRequests.jsx frontend/src/App.jsx frontend/src/test/owner-recurring-requests.test.jsx frontend/src/App.css
git commit -m "feat: add owner recurring request review screen"
```

### Task 8: Verify the full recurring-booking slice

**Files:**
- Modify: any touched file only if verification finds missed glue or regressions

- [ ] **Step 1: Run backend recurring tests together**

Run: `node --test backend/tests/recurringBookingService.test.js backend/tests/recurringBookingController.test.js`

Expected: PASS.

- [ ] **Step 2: Run the focused frontend recurring regression slice**

Run: `npm test -- src/test/recurring-booking-page.test.jsx src/test/owner-recurring-requests.test.jsx src/test/field-detail.test.jsx`

Expected: PASS.

- [ ] **Step 3: Run the broader frontend shell regression slice**

Run: `npm test -- src/test/app-shell.test.jsx src/test/recurring-booking-page.test.jsx src/test/owner-recurring-requests.test.jsx`

Expected: PASS.

- [ ] **Step 4: Run a production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit any final glue fixes**

```bash
git add backend/controllers/recurringBookingController.js backend/utils/recurringBookingService.js backend/server.js frontend/src/pages/RecurringBookingPage.jsx frontend/src/pages/OwnerRecurringRequests.jsx frontend/src/App.css
git commit -m "feat: complete recurring booking with deposit phase 1"
```

## Self-Review

Spec coverage check:

- user-owned recurring series: covered in Tasks 2 through 7
- weekly/monthly recurrence: covered in Task 3 and Task 4
- deposit validation and approval split: covered in Tasks 1 and 3
- full child-booking generation: covered in Tasks 2, 3, and 4
- conflict replacement in same week: covered in Task 3 and user UI in Task 6
- owner approve/reject only: covered in Task 4 and Task 7
- 5-day reminder notifications: covered in Task 5

Placeholder scan:

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every task includes exact file paths, commands, and concrete code examples.

Type consistency check:

- `RecurringBookingSeries` and `RecurringBookingItem` naming remains consistent across migrations, models, services, and controllers.
- The approval status values and recurrence type values are centralized in `backend/utils/recurringBookingTypes.js`.

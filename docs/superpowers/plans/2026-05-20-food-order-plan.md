# Food And Drink Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a phase-1 food and drink ordering subsystem that lets owners manage field-specific menu items, lets users place food orders during booking and from booking detail, and keeps food payments separate from booking payments.

**Architecture:** Add a field-scoped menu layer plus booking-linked food-order records instead of merging food into the existing booking invoice. Reuse the existing wallet/VnPay/MoMo payment ecosystem where practical, keep owner operations simple with three delivery statuses, and enforce the booking-time ordering window in backend services.

**Tech Stack:** Node.js, Express, Sequelize, MySQL migrations, React 19, React Router 7, Axios, node:test, Vitest, React Testing Library

---

## File Structure

**Files and responsibilities:**

- Create: `backend/migrations/20260520000004-create-menu-items.js`
  Responsibility: add menu items per field.
- Create: `backend/migrations/20260520000005-create-food-orders.js`
  Responsibility: add parent food-order rows linked to bookings.
- Create: `backend/migrations/20260520000006-create-food-order-items.js`
  Responsibility: add line items for each food order.
- Create: `backend/models/menuitem.js`
  Responsibility: define menu item model and associations.
- Create: `backend/models/foodorder.js`
  Responsibility: define food-order model and associations.
- Create: `backend/models/foodorderitem.js`
  Responsibility: define food-order-item model and associations.
- Modify: `backend/models/field.js`
  Responsibility: expose menu and food-order relations.
- Modify: `backend/models/booking.js`
  Responsibility: expose booking -> food-order relation.
- Modify: `backend/models/user.js`
  Responsibility: expose user -> food-order relation.
- Create: `backend/utils/foodOrderTypes.js`
  Responsibility: centralize menu availability, food-order status, and payment-status constants.
- Create: `backend/utils/foodOrderService.js`
  Responsibility: validate field menu ownership, enforce booking time window, build order totals, create food orders, and update delivery status.
- Create: `backend/controllers/menuController.js`
  Responsibility: owner/admin CRUD for field menu items.
- Create: `backend/controllers/foodOrderController.js`
  Responsibility: user create/list/pay food orders and owner status updates.
- Create: `backend/routes/menuRoutes.js`
  Responsibility: menu CRUD and field-menu retrieval routes.
- Create: `backend/routes/foodOrderRoutes.js`
  Responsibility: booking-linked food-order routes.
- Modify: `backend/app.js`
  Responsibility: mount menu and food-order routes.
- Create: `backend/tests/foodOrderService.test.js`
  Responsibility: cover booking-window rules, total calculation, and owner-status transitions.
- Create: `backend/tests/foodOrderController.test.js`
  Responsibility: cover create flow, permission mapping, and owner status endpoints.
- Create: `frontend/src/services/menuService.js`
  Responsibility: frontend API wrapper for field menu CRUD and retrieval.
- Create: `frontend/src/services/foodOrderService.js`
  Responsibility: frontend API wrapper for create/list/pay/update flows.
- Create: `frontend/src/components/FoodOrderPicker.jsx`
  Responsibility: reusable item-card quantity selector for booking flow and booking detail.
- Create: `frontend/src/pages/OwnerFieldMenuPage.jsx`
  Responsibility: owner menu management for a field.
- Create: `frontend/src/pages/OwnerFoodOrdersPage.jsx`
  Responsibility: owner food-order status handling per field.
- Modify: `frontend/src/pages/FieldDetail.jsx`
  Responsibility: show food picker in booking flow and create initial food order when items are selected.
- Modify: `frontend/src/pages/BookingHistory.jsx` or booking-detail entry component
  Responsibility: expose a path into detailed booking view for additional food ordering.
- Modify: `frontend/src/pages/PaymentPage.jsx`
  Responsibility: support payment context for food orders if the route is already reusable.
- Modify: `frontend/src/pages/PaymentMoMo.jsx`
  Responsibility: support payment context for food orders if the route is already reusable.
- Modify: `frontend/src/App.jsx`
  Responsibility: register owner menu/order routes and any booking-detail route needed for add-on ordering.
- Modify: `frontend/src/components/MainLayout.jsx`
  Responsibility: add owner entry points for menu and food-order pages.
- Modify: `frontend/src/App.css`
  Responsibility: style food item cards, order status chips, and owner management screens using the existing design system.
- Create: `frontend/src/test/food-order-picker.test.jsx`
  Responsibility: verify quantity controls and subtotal behavior.
- Create: `frontend/src/test/owner-field-menu-page.test.jsx`
  Responsibility: verify owner menu management UI.
- Create: `frontend/src/test/owner-food-orders-page.test.jsx`
  Responsibility: verify owner status transitions UI.

This plan intentionally does **not** include combo products, analytics dashboards, or a full POS workflow.

### Task 1: Lock food-order domain rules with service-level backend tests

**Files:**
- Create: `backend/utils/foodOrderTypes.js`
- Create: `backend/tests/foodOrderService.test.js`

- [ ] **Step 1: Create the domain constants file before writing any service logic**

```js
const MENU_ITEM_AVAILABILITY = {
  AVAILABLE: true,
  UNAVAILABLE: false,
};

const FOOD_ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  DELIVERED: 'delivered',
};

const FOOD_ORDER_PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
};

module.exports = {
  MENU_ITEM_AVAILABILITY,
  FOOD_ORDER_STATUS,
  FOOD_ORDER_PAYMENT_STATUS,
};
```

- [ ] **Step 2: Write failing service tests for total calculation, booking-window restriction, and status transitions**

```js
test('buildFoodOrderTotal snapshots menu prices into line totals', () => {
  const result = buildFoodOrderTotal([
    { id: 1, price: 15000, quantity: 2 },
    { id: 2, price: 25000, quantity: 1 },
  ]);

  assert.equal(result.totalAmount, 55000);
  assert.equal(result.items[0].lineTotal, 30000);
});

test('assertBookingOrderWindow rejects ordering after booking end time has passed', () => {
  assert.throws(
    () =>
      assertBookingOrderWindow({
        bookingDate: '2026-05-20',
        endTime: '19:00:00',
        now: new Date('2026-05-20T19:30:00'),
      }),
    /FOOD_ORDER_WINDOW_CLOSED/
  );
});

test('advanceFoodOrderStatus allows pending to preparing then delivered', () => {
  assert.equal(advanceFoodOrderStatus('pending', 'preparing'), 'preparing');
  assert.equal(advanceFoodOrderStatus('preparing', 'delivered'), 'delivered');
});
```

- [ ] **Step 3: Run the new service test file to verify it fails before implementation**

Run: `node --test backend/tests/foodOrderService.test.js`

Expected: FAIL because `buildFoodOrderTotal`, `assertBookingOrderWindow`, and `advanceFoodOrderStatus` do not exist yet.

- [ ] **Step 4: Commit the food-order domain contract**

```bash
git add backend/utils/foodOrderTypes.js backend/tests/foodOrderService.test.js
git commit -m "test: define food order domain rules"
```

### Task 2: Add persistence for menu items, food orders, and order items

**Files:**
- Create: `backend/migrations/20260520000004-create-menu-items.js`
- Create: `backend/migrations/20260520000005-create-food-orders.js`
- Create: `backend/migrations/20260520000006-create-food-order-items.js`
- Create: `backend/models/menuitem.js`
- Create: `backend/models/foodorder.js`
- Create: `backend/models/foodorderitem.js`
- Modify: `backend/models/field.js`
- Modify: `backend/models/booking.js`
- Modify: `backend/models/user.js`
- Test: `backend/tests/foodOrderService.test.js`

- [ ] **Step 1: Create the menu items migration**

```js
await queryInterface.createTable('menu_items', {
  id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
  field_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'fields', key: 'id' },
    onDelete: 'CASCADE',
  },
  name: { allowNull: false, type: Sequelize.STRING(255) },
  price: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  image: { allowNull: true, type: Sequelize.STRING(255) },
  is_available: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: true },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});
```

- [ ] **Step 2: Create the food orders migration**

```js
await queryInterface.createTable('food_orders', {
  id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
  booking_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'bookings', key: 'id' },
    onDelete: 'CASCADE',
  },
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
  status: { allowNull: false, type: Sequelize.STRING(32), defaultValue: 'pending' },
  total_amount: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  payment_method: { allowNull: true, type: Sequelize.STRING(32) },
  payment_status: { allowNull: false, type: Sequelize.STRING(32), defaultValue: 'unpaid' },
  ordered_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});
```

- [ ] **Step 3: Create the food order items migration**

```js
await queryInterface.createTable('food_order_items', {
  id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
  food_order_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'food_orders', key: 'id' },
    onDelete: 'CASCADE',
  },
  menu_item_id: {
    allowNull: false,
    type: Sequelize.INTEGER,
    references: { model: 'menu_items', key: 'id' },
    onDelete: 'CASCADE',
  },
  quantity: { allowNull: false, type: Sequelize.INTEGER },
  unit_price: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  line_total: { allowNull: false, type: Sequelize.DECIMAL(12, 0) },
  createdAt: { allowNull: false, type: Sequelize.DATE },
  updatedAt: { allowNull: false, type: Sequelize.DATE },
});
```

- [ ] **Step 4: Add the three new Sequelize models with booking/field/user associations**

```js
FoodOrder.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
FoodOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
FoodOrder.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
FoodOrder.hasMany(models.FoodOrderItem, { foreignKey: 'food_order_id', as: 'items' });

MenuItem.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
Field.hasMany(models.MenuItem, { foreignKey: 'field_id', as: 'menuItems' });
Booking.hasMany(models.FoodOrder, { foreignKey: 'booking_id', as: 'foodOrders' });
User.hasMany(models.FoodOrder, { foreignKey: 'user_id', as: 'foodOrders' });
```

- [ ] **Step 5: Re-run the existing service test file to confirm schema/model changes did not break the domain tests**

Run: `node --test backend/tests/foodOrderService.test.js`

Expected: PASS once Task 1 implementation exists, still green after model wiring.

- [ ] **Step 6: Commit persistence scaffolding**

```bash
git add backend/migrations/20260520000004-create-menu-items.js backend/migrations/20260520000005-create-food-orders.js backend/migrations/20260520000006-create-food-order-items.js backend/models/menuitem.js backend/models/foodorder.js backend/models/foodorderitem.js backend/models/field.js backend/models/booking.js backend/models/user.js
git commit -m "feat: add food order persistence models"
```

### Task 3: Implement backend food-order service and menu/order controllers

**Files:**
- Create: `backend/utils/foodOrderService.js`
- Create: `backend/controllers/menuController.js`
- Create: `backend/controllers/foodOrderController.js`
- Create: `backend/routes/menuRoutes.js`
- Create: `backend/routes/foodOrderRoutes.js`
- Modify: `backend/app.js`
- Test: `backend/tests/foodOrderService.test.js`
- Test: `backend/tests/foodOrderController.test.js`

- [ ] **Step 1: Write failing controller tests for creating an order and for owner status updates**

```js
test('createFoodOrder returns 201 when booking is active and menu items are available', async () => {
  const response = createResponseRecorder();
  await controller.createFoodOrder(
    {
      params: { bookingId: '15' },
      body: { items: [{ menu_item_id: 1, quantity: 2 }], payment_method: 'wallet' },
      user: { id: 7, role: 1 },
    },
    response
  );

  assert.equal(response.statusCode, 201);
});

test('updateFoodOrderStatus rejects owner changes outside the valid transition path', async () => {
  await assert.rejects(
    () => advanceFoodOrderStatus('pending', 'delivered'),
    /INVALID_FOOD_ORDER_STATUS_TRANSITION/
  );
});
```

- [ ] **Step 2: Run controller and service tests to verify the new failures**

Run: `node --test backend/tests/foodOrderService.test.js backend/tests/foodOrderController.test.js`

Expected: FAIL because the service and controller endpoints are not implemented yet.

- [ ] **Step 3: Implement minimal service helpers for totals, booking-window validation, menu loading, and status transitions**

```js
const buildFoodOrderTotal = (rows) => {
  const items = rows.map((row) => ({
    menuItemId: row.id,
    quantity: row.quantity,
    unitPrice: Number(row.price),
    lineTotal: Number(row.price) * Number(row.quantity),
  }));

  return {
    items,
    totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
};

const assertBookingOrderWindow = ({ bookingDate, endTime, now = new Date() }) => {
  const boundary = new Date(`${bookingDate}T${String(endTime).slice(0, 8)}`);
  if (now > boundary) {
    throw new Error('FOOD_ORDER_WINDOW_CLOSED');
  }
};
```

- [ ] **Step 4: Implement menu CRUD and food-order create/list/pay/status controllers with route mounting**

```js
router.get('/fields/:fieldId/menu', menuController.getFieldMenu);
router.post('/fields/:fieldId/menu', verifyToken, checkRole([2]), menuController.createMenuItem);
router.post('/bookings/:bookingId/orders', verifyToken, foodOrderController.createFoodOrder);
router.get('/bookings/:bookingId/orders', verifyToken, foodOrderController.listFoodOrdersForBooking);
router.put('/orders/:id/status', verifyToken, checkRole([2]), foodOrderController.updateFoodOrderStatus);
```

- [ ] **Step 5: Re-run backend food-order tests until they pass cleanly**

Run: `node --test backend/tests/foodOrderService.test.js backend/tests/foodOrderController.test.js`

Expected: PASS

- [ ] **Step 6: Commit backend menu and food-order logic**

```bash
git add backend/utils/foodOrderService.js backend/controllers/menuController.js backend/controllers/foodOrderController.js backend/routes/menuRoutes.js backend/routes/foodOrderRoutes.js backend/app.js backend/tests/foodOrderService.test.js backend/tests/foodOrderController.test.js
git commit -m "feat: add food order backend flows"
```

### Task 4: Integrate food orders into booking detail and booking flow UI

**Files:**
- Create: `frontend/src/services/menuService.js`
- Create: `frontend/src/services/foodOrderService.js`
- Create: `frontend/src/components/FoodOrderPicker.jsx`
- Modify: `frontend/src/pages/FieldDetail.jsx`
- Modify: booking-detail page used by the project for per-booking user actions
- Create: `frontend/src/test/food-order-picker.test.jsx`

- [ ] **Step 1: Write the failing picker test for quantity control and subtotal output**

```jsx
it('lets the user add and remove menu quantities and shows subtotal', async () => {
  render(<FoodOrderPicker items={[{ id: 1, name: 'Pepsi', price: 15000, is_available: true }]} />);

  await user.click(screen.getByRole('button', { name: /\+/i }));
  expect(screen.getByText(/15\.000/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the picker test to confirm it fails before the component exists**

Run: `npm test -- src/test/food-order-picker.test.jsx`

Expected: FAIL because `FoodOrderPicker` does not exist yet.

- [ ] **Step 3: Implement the picker, menu services, and hook the picker into the booking flow**

```jsx
<FoodOrderPicker
  items={menuItems}
  selections={foodSelections}
  onIncrease={(itemId) => updateQuantity(itemId, 1)}
  onDecrease={(itemId) => updateQuantity(itemId, -1)}
/>
```

- [ ] **Step 4: Extend the booking submit flow so selected items create an initial food-order payload after booking creation**

```js
if (selectedFoodItems.length > 0) {
  await createFoodOrder(response.data.data.id, {
    items: selectedFoodItems,
    payment_method: selectedFoodPaymentMethod,
  });
}
```

- [ ] **Step 5: Re-run the picker test and the existing booking-flow tests**

Run: `npm test -- src/test/food-order-picker.test.jsx src/test/field-detail.test.jsx`

Expected: PASS

- [ ] **Step 6: Commit booking-flow food ordering UI**

```bash
git add frontend/src/services/menuService.js frontend/src/services/foodOrderService.js frontend/src/components/FoodOrderPicker.jsx frontend/src/pages/FieldDetail.jsx frontend/src/test/food-order-picker.test.jsx
git commit -m "feat: add food ordering to booking flow"
```

### Task 5: Build owner menu management and owner food-order operations UI

**Files:**
- Create: `frontend/src/pages/OwnerFieldMenuPage.jsx`
- Create: `frontend/src/pages/OwnerFoodOrdersPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/MainLayout.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/test/owner-field-menu-page.test.jsx`
- Create: `frontend/src/test/owner-food-orders-page.test.jsx`

- [ ] **Step 1: Write failing owner-page tests for menu CRUD rendering and food-order status actions**

```jsx
it('renders owner field menu items and create button', async () => {
  render(<OwnerFieldMenuPage />);
  expect(await screen.findByRole('heading', { name: /menu san/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /them mon/i })).toBeInTheDocument();
});

it('renders owner food orders and status buttons', async () => {
  render(<OwnerFoodOrdersPage />);
  expect(await screen.findByRole('button', { name: /dang chuan bi/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the owner-page tests to confirm they fail before implementation**

Run: `npm test -- src/test/owner-field-menu-page.test.jsx src/test/owner-food-orders-page.test.jsx`

Expected: FAIL because the owner pages do not exist yet.

- [ ] **Step 3: Implement owner menu and food-order pages with routes and navigation links**

```jsx
<Route path="/owner/fields/:fieldId/menu" element={<OwnerFieldMenuPage />} />
<Route path="/owner/fields/:fieldId/food-orders" element={<OwnerFoodOrdersPage />} />
```

- [ ] **Step 4: Add shared styles for food cards, owner order rows, and status chips**

```css
.food-order-card,
.menu-item-card {
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
}
```

- [ ] **Step 5: Re-run owner UI tests and app-shell coverage**

Run: `npm test -- src/test/owner-field-menu-page.test.jsx src/test/owner-food-orders-page.test.jsx src/test/app-shell.test.jsx`

Expected: PASS

- [ ] **Step 6: Commit owner operations UI**

```bash
git add frontend/src/pages/OwnerFieldMenuPage.jsx frontend/src/pages/OwnerFoodOrdersPage.jsx frontend/src/App.jsx frontend/src/components/MainLayout.jsx frontend/src/App.css frontend/src/test/owner-field-menu-page.test.jsx frontend/src/test/owner-food-orders-page.test.jsx
git commit -m "feat: add owner food order management pages"
```

### Task 6: Run end-to-end verification for food ordering and regression coverage

**Files:**
- Modify: none required unless verification finds issues
- Test: `backend/tests/foodOrderService.test.js`
- Test: `backend/tests/foodOrderController.test.js`
- Test: `backend/tests/bookingWalletFlow.test.js`
- Test: `frontend/src/test/food-order-picker.test.jsx`
- Test: `frontend/src/test/field-detail.test.jsx`
- Test: `frontend/src/test/owner-field-menu-page.test.jsx`
- Test: `frontend/src/test/owner-food-orders-page.test.jsx`
- Test: `frontend/src/test/app-shell.test.jsx`

- [ ] **Step 1: Run backend verification for food order plus existing wallet/booking protections**

Run: `node --test backend/tests/foodOrderService.test.js backend/tests/foodOrderController.test.js backend/tests/bookingWalletFlow.test.js`

Expected: PASS

- [ ] **Step 2: Run frontend verification for food ordering and shell navigation**

Run: `npm test -- src/test/food-order-picker.test.jsx src/test/field-detail.test.jsx src/test/owner-field-menu-page.test.jsx src/test/owner-food-orders-page.test.jsx src/test/app-shell.test.jsx`

Expected: PASS

- [ ] **Step 3: Build the frontend to confirm production bundling still succeeds**

Run: `npm run build`

Expected: PASS with at most existing chunk-size warnings.

- [ ] **Step 4: Commit verification-only fixes if any were required**

```bash
git add .
git commit -m "test: verify food order feature end to end"
```

## Self-Review

### Spec coverage

- Owner-managed menu per field is covered by Task 2 and Task 5.
- Admin override is covered by Task 3 route/controller scope.
- User ordering during booking and later from booking detail is covered by Task 4.
- Separate food-order invoices linked to bookings are covered by Task 2 schema and Task 3 service/controller logic.
- Multiple food orders under one booking are covered by Task 2 and Task 3.
- Status flow `pending -> preparing -> delivered` is covered by Task 1 and Task 3.
- Payment methods wallet/VnPay/MoMo are covered by Task 3 and Task 4.
- Booking-time window restriction is covered by Task 1 and Task 3.

No spec gaps found.

### Placeholder scan

- No `TBD`, `TODO`, or deferred placeholder language remains.
- Each task has explicit files, commands, and concrete examples.

### Type consistency

- `menu_items`, `food_orders`, and `food_order_items` are used consistently across schema, models, and tests.
- `FOOD_ORDER_STATUS` and `FOOD_ORDER_PAYMENT_STATUS` are used consistently in service/controller tasks.
- User-facing route names are consistent between service, page, and router tasks.

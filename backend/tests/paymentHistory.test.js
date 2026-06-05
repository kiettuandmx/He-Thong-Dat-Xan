const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildPaymentHistoryTransactions,
  filterTransactionsByDateRange,
  paginateTransactions,
  resolveHistoryFilters,
} = require('../utils/paymentHistory');

function createBooking(overrides = {}) {
  return {
    id: 101,
    amount_paid: 500000,
    payment_status: 'paid',
    payment_method: 'momo',
    payment_recorded_at: new Date('2026-05-10T08:15:00.000Z'),
    createdAt: new Date('2026-05-10T08:00:00.000Z'),
    refunded_at: new Date('2026-05-11T09:00:00.000Z'),
    refund_reason: 'Khach huy san',
    status: 'refunded',
    field: {
      name: 'San 1',
      stadium: { name: 'San ABC' },
    },
    user: {
      name: 'Nguyen Van A',
      phone: '0912345678',
    },
    ...overrides,
  };
}

function createFoodOrder(overrides = {}) {
  return {
    id: 501,
    booking_id: 101,
    user_id: 88,
    total_amount: 35000,
    payment_method: 'bank_transfer',
    payment_status: 'paid',
    payment_recorded_at: new Date('2026-05-12T08:15:00.000Z'),
    ordered_at: new Date('2026-05-12T08:00:00.000Z'),
    order_source: 'post_booking',
    field: {
      name: 'San 1',
      stadium: { name: 'San ABC' },
    },
    user: {
      name: 'Nguyen Van A',
      phone: '0912345678',
    },
    booking: createBooking({
      refunded_at: null,
      status: 'confirmed',
    }),
    ...overrides,
  };
}

function createResponseRecorder() {
  return {
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
}

async function withControllerMocks(mockDb, runAssertion) {
  const modelsPath = require.resolve('../models');
  const socketPath = require.resolve('../socket');
  const controllerPath = require.resolve('../controllers/bookingController');

  const originalModels = require.cache[modelsPath];
  const originalSocket = require.cache[socketPath];
  const originalController = require.cache[controllerPath];

  require.cache[modelsPath] = {
    id: modelsPath,
    filename: modelsPath,
    loaded: true,
    exports: mockDb,
  };
  require.cache[socketPath] = {
    id: socketPath,
    filename: socketPath,
    loaded: true,
    exports: {
      getIO: () => ({ to: () => ({ emit: () => {} }), emit: () => {} }),
      userSockets: {},
    },
  };
  delete require.cache[controllerPath];

  try {
    const controller = require('../controllers/bookingController');
    await runAssertion(controller);
  } finally {
    if (originalModels) {
      require.cache[modelsPath] = originalModels;
    } else {
      delete require.cache[modelsPath];
    }

    if (originalSocket) {
      require.cache[socketPath] = originalSocket;
    } else {
      delete require.cache[socketPath];
    }

    if (originalController) {
      require.cache[controllerPath] = originalController;
    } else {
      delete require.cache[controllerPath];
    }
  }
}

test('buildPaymentHistoryTransactions creates payment and refund rows', () => {
  const transactions = buildPaymentHistoryTransactions([createBooking()]);

  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].type, 'refund');
  assert.equal(transactions[1].type, 'payment');
  assert.equal(transactions[0].refundAmount, 500000);
  assert.equal(transactions[0].actualRevenue, 0);
  assert.equal(transactions[0].status, 'refunded');
  assert.equal(transactions[1].refundAmount, 0);
  assert.equal(transactions[1].actualRevenue, 500000);
  assert.equal(transactions[1].status, 'paid');
});

test('buildPaymentHistoryTransactions includes post-booking food order payments', () => {
  const transactions = buildPaymentHistoryTransactions(
    [createBooking({ refunded_at: null })],
    [createFoodOrder()],
  );

  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].source, 'food_order');
  assert.equal(transactions[0].foodOrderId, 501);
  assert.equal(transactions[0].type, 'payment');
  assert.equal(transactions[0].amount, 35000);
  assert.equal(transactions[0].status, 'paid');
});

test('buildPaymentHistoryTransactions ignores checkout food orders to avoid double counting', () => {
  const transactions = buildPaymentHistoryTransactions(
    [createBooking({ refunded_at: null })],
    [createFoodOrder({ order_source: 'booking_checkout' })],
  );

  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].source, 'booking');
});

test('payment transaction prefers payment_recorded_at over createdAt', () => {
  const paymentTransaction = buildPaymentHistoryTransactions([
    createBooking({
      refunded_at: null,
      payment_recorded_at: new Date('2026-05-10T12:00:00.000Z'),
      createdAt: new Date('2026-05-10T01:00:00.000Z'),
    }),
  ])[0];

  assert.equal(
    new Date(paymentTransaction.transactionDate).toISOString(),
    '2026-05-10T12:00:00.000Z',
  );
});

test('cancelled booking with financial activity stays visible', () => {
  const transactions = buildPaymentHistoryTransactions([
    createBooking({ status: 'cancelled' }),
  ]);

  assert.equal(transactions.length, 2);
});

test('booking without payment and refund is excluded', () => {
  const transactions = buildPaymentHistoryTransactions([
    createBooking({
      amount_paid: 0,
      payment_status: 'unpaid',
      payment_recorded_at: null,
      refunded_at: null,
    }),
  ]);

  assert.equal(transactions.length, 0);
});

test('filterTransactionsByDateRange uses transaction timestamps', () => {
  const transactions = buildPaymentHistoryTransactions([createBooking()]);
  const filters = resolveHistoryFilters({
    startDate: '2026-05-11',
    endDate: '2026-05-11',
  });

  const filtered = filterTransactionsByDateRange(
    transactions,
    filters.startDate,
    filters.endDate,
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].type, 'refund');
});

test('resolveHistoryFilters defaults to the current month in Vietnam time', () => {
  const filters = resolveHistoryFilters({}, new Date('2026-05-13T03:00:00.000Z'));

  assert.equal(filters.startDate.toISOString(), '2026-04-30T17:00:00.000Z');
  assert.equal(filters.endDate.toISOString(), '2026-05-31T16:59:59.999Z');
});

test('paginateTransactions slices transactions by page and limit', () => {
  const rows = [{ bookingId: 1 }, { bookingId: 2 }, { bookingId: 3 }];

  const page = paginateTransactions(rows, 2, 2);

  assert.deepEqual(page, [{ bookingId: 3 }]);
});

test('getUserPaymentHistory returns post-booking food order payments', async () => {
  await withControllerMocks(
    {
      Booking: {
        findAll: async () => [],
      },
      FoodOrder: {
        findAll: async () => [createFoodOrder()],
      },
      Field: {},
      Stadium: {},
      User: {},
      sequelize: {},
      Sequelize: { Op: {} },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.getUserPaymentHistory(
        {
          user: { id: 88 },
          query: { month: '05', year: '2026', page: 1, limit: 10 },
        },
        response,
      );

      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.transactions.length, 1);
      assert.equal(response.payload.transactions[0].source, 'food_order');
      assert.equal(response.payload.transactions[0].foodOrderId, 501);
    },
  );
});

test('getOwnerPaymentHistory returns post-booking food order payments for owner stadiums', async () => {
  await withControllerMocks(
    {
      Booking: {
        findAll: async () => [],
      },
      FoodOrder: {
        findAll: async () => [createFoodOrder()],
      },
      Field: {},
      Stadium: {
        findAll: async () => [{ id: 33 }],
      },
      User: {},
      sequelize: {},
      Sequelize: { Op: {} },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.getOwnerPaymentHistory(
        {
          user: { id: 12 },
          query: { month: '05', year: '2026', page: 1, limit: 10 },
        },
        response,
      );

      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.transactions.length, 1);
      assert.equal(response.payload.transactions[0].source, 'food_order');
      assert.equal(response.payload.transactions[0].foodOrderId, 501);
    },
  );
});

test('getUserPaymentHistory returns only the authenticated user summary', async () => {
  const bookings = [
    createBooking({
      id: 201,
      refunded_at: null,
      payment_recorded_at: new Date('2026-05-09T08:00:00.000Z'),
    }),
  ];

  await withControllerMocks(
    {
      Booking: { findAll: async () => bookings },
      FoodOrder: { findAll: async () => [] },
      Field: {},
      Stadium: {},
      User: {},
      Notification: { create: async () => ({}) },
      sequelize: { transaction: async () => ({}) },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.getUserPaymentHistory(
        {
          user: { id: 7 },
          query: { month: '05', year: '2026', page: '1', limit: '10' },
        },
        response,
      );

      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.transactions.length, 1);
      assert.equal(response.payload.summary.totalPayment, 500000);
      assert.equal(response.payload.summary.totalRefund, 0);
    },
  );
});

test('getOwnerPaymentHistory returns owner summary and customer fields', async () => {
  const bookings = [
    createBooking({
      id: 301,
      status: 'refunded',
    }),
  ];

  await withControllerMocks(
    {
      Booking: { findAll: async () => bookings },
      FoodOrder: { findAll: async () => [] },
      Field: {},
      Stadium: { findAll: async () => [{ id: 9 }] },
      User: {},
      Notification: { create: async () => ({}) },
      sequelize: { transaction: async () => ({}) },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.getOwnerPaymentHistory(
        {
          user: { id: 88 },
          query: { month: '05', year: '2026', page: '1', limit: '10' },
        },
        response,
      );

      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.success, true);
      assert.equal(response.payload.summary.totalPayment, 500000);
      assert.equal(response.payload.summary.totalRefund, 500000);
      assert.equal(response.payload.summary.netRevenue, 0);
      assert.equal(response.payload.transactions[0].userName, 'Nguyen Van A');
    },
  );
});

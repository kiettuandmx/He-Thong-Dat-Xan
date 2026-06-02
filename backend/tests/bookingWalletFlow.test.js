const test = require('node:test');
const assert = require('node:assert/strict');

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

async function withBookingControllerMocks(mockDb, runAssertion) {
  const modelsPath = require.resolve('../models');
  const socketPath = require.resolve('../socket');
  const loggerPath = require.resolve('../utils/adminActivityLogger');
  const notificationPath = require.resolve('../utils/notificationHelper');
  const bookingAccessPath = require.resolve('../utils/bookingAccess');
  const paymentHistoryPath = require.resolve('../utils/paymentHistory');
  const couponUsagePath = require.resolve('../utils/couponUsage');
  const controllerPath = require.resolve('../controllers/bookingController');

  const originalEntries = {
    models: require.cache[modelsPath],
    socket: require.cache[socketPath],
    logger: require.cache[loggerPath],
    notification: require.cache[notificationPath],
    bookingAccess: require.cache[bookingAccessPath],
    paymentHistory: require.cache[paymentHistoryPath],
    couponUsage: require.cache[couponUsagePath],
    controller: require.cache[controllerPath],
  };

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
      getIO: () => ({ emit: () => {}, to: () => ({ emit: () => {} }) }),
      userSockets: {},
    },
  };
  require.cache[loggerPath] = {
    id: loggerPath,
    filename: loggerPath,
    loaded: true,
    exports: { logAdminActivity: async () => {} },
  };
  require.cache[notificationPath] = {
    id: notificationPath,
    filename: notificationPath,
    loaded: true,
    exports: { createNotification: async () => ({}) },
  };
  require.cache[bookingAccessPath] = {
    id: bookingAccessPath,
    filename: bookingAccessPath,
    loaded: true,
    exports: {
      canAccessBookingDetail: () => true,
      isAdminUser: () => false,
      resolveBookingCreatorId: (req) => req.user?.id || req.body?.user_id,
    },
  };
  require.cache[paymentHistoryPath] = {
    id: paymentHistoryPath,
    filename: paymentHistoryPath,
    loaded: true,
    exports: {
      buildPaymentHistoryTransactions: () => [],
      filterTransactionsByDateRange: (items) => items,
      paginateTransactions: (items) => items,
      resolveHistoryFilters: () => ({}),
      toNumber: (value) => Number(value || 0),
    },
  };
  require.cache[couponUsagePath] = {
    id: couponUsagePath,
    filename: couponUsagePath,
    loaded: true,
    exports: {
      normalizeCouponCode: (code) => code,
      assertCouponUsageAllowed: async () => {},
    },
  };
  delete require.cache[controllerPath];

  try {
    const controller = require('../controllers/bookingController');
    await runAssertion(controller);
  } finally {
    for (const [key, value] of Object.entries(originalEntries)) {
      const map = {
        models: modelsPath,
        socket: socketPath,
        logger: loggerPath,
        notification: notificationPath,
        bookingAccess: bookingAccessPath,
        paymentHistory: paymentHistoryPath,
        couponUsage: couponUsagePath,
        controller: controllerPath,
      };

      if (value) {
        require.cache[map[key]] = value;
      } else {
        delete require.cache[map[key]];
      }
    }
  }
}

test('createBooking marks wallet-paid booking as paid without redirect flow', async () => {
  const createdBookings = [];

  await withBookingControllerMocks(
    {
      Booking: {
        findOne: async () => null,
        create: async (payload) => {
          const created = { id: 99, ...payload };
          createdBookings.push(created);
          return created;
        },
      },
      Field: {
        findByPk: async () => ({
          id: 3,
          price_per_hour: 200000,
          stadium: { owner_id: 44 },
        }),
      },
      Stadium: {},
      User: {},
      Coupon: { findOne: async () => null },
      Wallet: {
        findOne: async () => ({
          id: 1,
          user_id: 7,
          balance: 400000,
          async save() {},
        }),
        create: async () => ({ id: 1, user_id: 7, balance: 0, async save() {} }),
      },
      WalletTransaction: { create: async () => ({}) },
      Sequelize: { Op: { notIn: Symbol('notIn') } },
      sequelize: {
        transaction: async () => ({
          LOCK: { UPDATE: 'UPDATE' },
          finished: false,
          commit: async function commit() { this.finished = 'commit'; },
          rollback: async function rollback() { this.finished = 'rollback'; },
        }),
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.createBooking(
        {
          body: {
            field_id: 3,
            stadium_id: 5,
            booking_date: '2026-05-20',
            start_time: '18:00',
            end_time: '19:00',
            payment_type: 'full',
            payment_method: 'wallet',
          },
          headers: {},
          ip: '127.0.0.1',
          user: { id: 7, role_id: 1 },
        },
        response
      );

      assert.equal(response.statusCode, 201);
      assert.equal(response.payload.data.payment_status, 'paid');
      assert.equal(response.payload.data.payment_method, 'wallet');
      assert.equal(response.payload.data.status, 'confirmed');
      assert.equal(createdBookings[0].hold_until, null);
    }
  );
});

test('createBooking assigns a payment reference for direct transfer bookings', async () => {
  const createdBookings = [];

  await withBookingControllerMocks(
    {
      Booking: {
        findOne: async () => null,
        create: async (payload) => {
          const created = {
            id: 120,
            ...payload,
            async update(nextPayload) {
              Object.assign(this, nextPayload);
              return this;
            },
          };
          createdBookings.push(created);
          return created;
        },
      },
      Field: {
        findByPk: async () => ({
          id: 3,
          price_per_hour: 200000,
          stadium: { owner_id: 44 },
        }),
      },
      Stadium: {},
      User: {},
      Coupon: { findOne: async () => null },
      Wallet: {},
      WalletTransaction: { create: async () => ({}) },
      Sequelize: { Op: { notIn: Symbol('notIn') } },
      sequelize: {
        transaction: async () => ({
          LOCK: { UPDATE: 'UPDATE' },
          finished: false,
          commit: async function commit() { this.finished = 'commit'; },
          rollback: async function rollback() { this.finished = 'rollback'; },
        }),
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.createBooking(
        {
          body: {
            field_id: 3,
            stadium_id: 5,
            booking_date: '2026-05-20',
            start_time: '18:00',
            end_time: '19:00',
            payment_type: 'deposit',
            payment_method: 'bank_transfer',
          },
          headers: {},
          ip: '127.0.0.1',
          user: { id: 7, role_id: 1 },
        },
        response
      );

      assert.equal(response.statusCode, 201);
      assert.equal(response.payload.data.payment_reference, 'BK120');
      assert.equal(createdBookings[0].payment_reference, 'BK120');
      assert.equal(response.payload.data.payment_status, 'unpaid');
      assert.equal(response.payload.data.status, 'pending');
    }
  );
});

test('refundBooking credits money back into wallet for refunded bookings', async () => {
  const walletTransactions = [];
  const booking = {
    id: 88,
    user_id: 7,
    amount_paid: 150000,
    status: 'confirmed',
    booking_date: '2026-05-20',
    field: {
      name: 'San so 1',
      stadium: { owner_id: 21 },
    },
    async update(payload) {
      Object.assign(this, payload);
    },
  };

  await withBookingControllerMocks(
    {
      Booking: {
        findByPk: async () => booking,
      },
      Field: {},
      Stadium: {},
      User: {},
      Notification: { create: async () => ({}) },
      Wallet: {
        findOne: async () => ({
          id: 1,
          user_id: 7,
          balance: 0,
          async save() {},
        }),
        create: async () => ({ id: 1, user_id: 7, balance: 0, async save() {} }),
      },
      WalletTransaction: {
        create: async (payload) => {
          walletTransactions.push(payload);
          return payload;
        },
      },
      Sequelize: { Op: { notIn: Symbol('notIn') } },
      sequelize: {
        transaction: async () => ({
          LOCK: { UPDATE: 'UPDATE' },
          finished: false,
          commit: async function commit() { this.finished = 'commit'; },
          rollback: async function rollback() { this.finished = 'rollback'; },
        }),
      },
    },
    async (controller) => {
      const response = createResponseRecorder();

      await controller.refundBooking(
        {
          params: { id: '88' },
          body: { refund_reason: 'Khach huy lich' },
          headers: {},
          ip: '127.0.0.1',
          user: { id: 21, role_id: 2 },
        },
        response
      );

      assert.equal(response.statusCode, 200);
      assert.equal(walletTransactions.length, 1);
      assert.equal(walletTransactions[0].type, 'BOOKING_REFUND');
      assert.equal(walletTransactions[0].amount, 150000);
    }
  );
});

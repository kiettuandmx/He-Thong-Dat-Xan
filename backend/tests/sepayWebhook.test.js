const test = require('node:test');
const assert = require('node:assert/strict');

const { reconcileSePayBookingTransfer } = require('../services/sepayBookingService');
const { extractPaymentReference } = require('../services/sepayBookingService');

function createMockDb({
  existingReceipt = null,
  booking = null,
  foodOrder = null,
  foodOrderCandidates = [],
  createdReceipts = [],
  savedBookings = [],
}) {
  return {
    Booking: {
      findOne: async () => booking,
    },
    BookingPaymentReceipt: {
      findOne: async () => existingReceipt,
      create: async (payload) => {
        createdReceipts.push(payload);
        return { id: createdReceipts.length, ...payload };
      },
    },
    FoodOrder: {
      findOne: async () => foodOrder,
      findAll: async () => foodOrderCandidates,
      update: async () => [1],
    },
    sequelize: {
      transaction: async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }),
    },
  };
}

function createBooking(overrides = {}) {
  return {
    id: 44,
    user_id: 7,
    field_id: 3,
    booking_date: '2026-06-01',
    start_time: '18:00:00',
    payment_reference: 'BK44',
    payment_type: 'deposit',
    amount_paid: 200000,
    payment_status: 'unpaid',
    payment_method: 'bank_transfer',
    payment_recorded_at: null,
    status: 'pending',
    hold_until: new Date('2026-06-01T18:00:00.000Z'),
    field: {
      stadium: {
        owner_id: 99,
      },
    },
    async save() {
      return this;
    },
    ...overrides,
  };
}

test('reconcileSePayBookingTransfer auto-confirms deposit booking on exact match', async () => {
  const createdReceipts = [];
  const notifications = [];
  const emitted = [];
  const booking = createBooking();
  const db = createMockDb({ booking, createdReceipts });

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-deposit-1',
      transferAmount: 200000,
      transferContent: 'Thanh toan BK44',
      transactionDate: '2026-06-01 16:00:00',
    },
    notify: async (payload) => {
      notifications.push(payload);
    },
    emitSlotConfirmed: (payload) => {
      emitted.push(payload);
    },
    now: new Date('2026-06-01T16:00:00.000Z'),
  });

  assert.equal(result.status, 'confirmed');
  assert.equal(booking.payment_status, 'partially_paid');
  assert.equal(booking.status, 'confirmed');
  assert.equal(booking.payment_method, 'sepay');
  assert.equal(booking.hold_until, null);
  assert.equal(createdReceipts.length, 1);
  assert.equal(createdReceipts[0].matched_status, 'matched');
  assert.equal(createdReceipts[0].booking_id, 44);
  assert.equal(notifications.length, 2);
  assert.deepEqual(emitted[0], {
    field_id: 3,
    date: '2026-06-01',
    start_time: '18:00:00',
  });
});

test('reconcileSePayBookingTransfer auto-confirms full booking on exact match', async () => {
  const createdReceipts = [];
  const booking = createBooking({
    payment_type: 'full',
    amount_paid: 400000,
    payment_reference: 'BK78',
    id: 78,
  });
  const db = createMockDb({ booking, createdReceipts });

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-full-1',
      transferAmount: 400000,
      transferContent: 'Thanh toan BK78',
    },
    notify: async () => {},
    emitSlotConfirmed: () => {},
    now: new Date('2026-06-01T16:00:00.000Z'),
  });

  assert.equal(result.status, 'confirmed');
  assert.equal(booking.payment_status, 'paid');
  assert.equal(booking.status, 'confirmed');
  assert.equal(createdReceipts[0].matched_status, 'matched');
});

test('reconcileSePayBookingTransfer does not confirm booking when amount is wrong', async () => {
  const createdReceipts = [];
  const booking = createBooking();
  const db = createMockDb({ booking, createdReceipts });

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-wrong-amount',
      transferAmount: 150000,
      transferContent: 'Thanh toan BK44',
    },
    notify: async () => {},
    emitSlotConfirmed: () => {},
    now: new Date('2026-06-01T16:00:00.000Z'),
  });

  assert.equal(result.status, 'mismatched');
  assert.equal(booking.payment_status, 'unpaid');
  assert.equal(booking.status, 'pending');
  assert.equal(createdReceipts[0].matched_status, 'mismatched');
});

test('reconcileSePayBookingTransfer stores unmatched receipt when payment reference does not resolve to a booking', async () => {
  const createdReceipts = [];
  const db = createMockDb({ booking: null, createdReceipts });

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-unmatched',
      transferAmount: 200000,
      transferContent: 'Thanh toan KHONGHOPLE',
    },
    notify: async () => {},
    emitSlotConfirmed: () => {},
    now: new Date('2026-06-01T16:00:00.000Z'),
  });

  assert.equal(result.status, 'unmatched');
  assert.equal(createdReceipts[0].matched_status, 'unmatched');
  assert.equal(createdReceipts[0].booking_id, null);
});

test('reconcileSePayBookingTransfer is idempotent for duplicate SePay callbacks', async () => {
  const createdReceipts = [];
  const booking = createBooking();
  const db = createMockDb({
    booking,
    createdReceipts,
    existingReceipt: {
      id: 1,
      provider_transaction_id: 'txn-dup-1',
      matched_status: 'matched',
    },
  });

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-dup-1',
      transferAmount: 200000,
      transferContent: 'Thanh toan BK44',
    },
    notify: async () => {},
    emitSlotConfirmed: () => {},
    now: new Date('2026-06-01T16:00:00.000Z'),
  });

  assert.equal(result.status, 'duplicate');
  assert.equal(createdReceipts.length, 0);
  assert.equal(booking.payment_status, 'unpaid');
});

test('reconcileSePayBookingTransfer does not revive expired bookings', async () => {
  const createdReceipts = [];
  const booking = createBooking({
    status: 'expired',
    payment_reference: 'BK145',
    id: 145,
  });
  const db = createMockDb({ booking, createdReceipts });

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-expired-1',
      transferAmount: 200000,
      transferContent: 'Thanh toan BK145',
    },
    notify: async () => {},
    emitSlotConfirmed: () => {},
    now: new Date('2026-06-01T16:00:00.000Z'),
  });

  assert.equal(result.status, 'ineligible');
  assert.equal(booking.status, 'expired');
  assert.equal(createdReceipts[0].matched_status, 'ineligible');
});

test('reconcileSePayBookingTransfer confirms bank transfer for post-booking food order', async () => {
  const createdReceipts = [];
  const foodOrder = {
    id: 9,
    booking_id: 44,
    user_id: 7,
    field_id: 3,
    total_amount: 45000,
    payment_reference: 'FO44-9',
    payment_status: 'unpaid',
    booking: {
      field: {
        stadium: {
          owner_id: 99,
        },
      },
    },
    async save() {
      return this;
    },
  };
  const db = createMockDb({ foodOrder, createdReceipts });
  const notifications = [];

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-food-1',
      transferAmount: 45000,
      transferContent: 'Thanh toan FO44-9',
    },
    notify: async (payload) => {
      notifications.push(payload);
    },
    emitSlotConfirmed: () => {},
    now: new Date('2026-06-03T10:00:00.000Z'),
  });

  assert.equal(result.status, 'confirmed');
  assert.equal(foodOrder.payment_status, 'paid');
  assert.equal(foodOrder.payment_method, 'sepay');
  assert.equal(createdReceipts[0].food_order_id, 9);
  assert.equal(notifications.length, 2);
});

test('extractPaymentReference prioritizes food order references when transfer content contains multiple payment codes', () => {
  const reference = extractPaymentReference({
    transferContent: 'Thanh toan BK44 va FO44-9',
  });

  assert.equal(reference, 'FO44-9');
});

test('reconcileSePayBookingTransfer matches compact food-order references when the transfer content loses the hyphen', async () => {
  const createdReceipts = [];
  const foodOrder = {
    id: 6,
    booking_id: 46,
    user_id: 7,
    field_id: 3,
    total_amount: 3000,
    payment_reference: 'FO46-6',
    payment_status: 'unpaid',
    booking: {
      field: {
        stadium: {
          owner_id: 99,
        },
      },
    },
    async save() {
      return this;
    },
  };
  const db = createMockDb({ foodOrder: null, foodOrderCandidates: [foodOrder], createdReceipts });

  const result = await reconcileSePayBookingTransfer({
    db,
    payload: {
      id: 'txn-food-compact-1',
      transferAmount: 3000,
      transferContent: 'Thanh toan FO466',
    },
    notify: async () => {},
    emitSlotConfirmed: () => {},
    now: new Date('2026-06-04T01:14:06.000Z'),
  });

  assert.equal(result.status, 'confirmed');
  assert.equal(foodOrder.payment_status, 'paid');
  assert.equal(foodOrder.payment_method, 'sepay');
  assert.equal(createdReceipts[0].food_order_id, 6);
});

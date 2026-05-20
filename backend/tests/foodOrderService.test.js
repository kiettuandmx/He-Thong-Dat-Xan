const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildFoodOrderTotal,
  assertBookingOrderWindow,
  advanceFoodOrderStatus,
} = require('../utils/foodOrderService');

test('buildFoodOrderTotal snapshots menu prices into line totals', () => {
  const result = buildFoodOrderTotal([
    { id: 1, price: 15000, quantity: 2 },
    { id: 2, price: 25000, quantity: 1 },
  ]);

  assert.equal(result.totalAmount, 55000);
  assert.equal(result.items[0].lineTotal, 30000);
  assert.equal(result.items[1].lineTotal, 25000);
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

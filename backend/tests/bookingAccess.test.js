const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canAccessBookingDetail,
  resolveBookingCreatorId,
} = require('../utils/bookingAccess');

test('resolveBookingCreatorId always prefers authenticated user id', () => {
  const result = resolveBookingCreatorId(
    { user: { id: 7 } },
    { user_id: 999 },
  );

  assert.equal(result, 7);
});

test('canAccessBookingDetail denies unrelated users', () => {
  const result = canAccessBookingDetail(
    { user: { id: 5, role: 1 } },
    { user_id: 7 },
  );

  assert.equal(result, false);
});

test('canAccessBookingDetail allows booking owner', () => {
  const result = canAccessBookingDetail(
    { user: { id: 7, role: 1 } },
    { user_id: 7 },
  );

  assert.equal(result, true);
});

test('canAccessBookingDetail allows admin', () => {
  const result = canAccessBookingDetail(
    { user: { id: 1, role: 3 } },
    { user_id: 7 },
  );

  assert.equal(result, true);
});

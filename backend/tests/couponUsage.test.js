const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');

const {
  KHACHMOI_CODE,
  THANGMOI_CODE,
  normalizeCouponCode,
  getMonthRange,
  assertCouponUsageAllowed,
} = require('../utils/couponUsage');

test('normalizeCouponCode trims and uppercases coupon codes', () => {
  assert.equal(normalizeCouponCode('  khachmoi '), KHACHMOI_CODE);
  assert.equal(normalizeCouponCode('thangmoi'), THANGMOI_CODE);
});

test('getMonthRange returns the current calendar month bounds', () => {
  const { start, end } = getMonthRange(new Date('2026-05-14T08:00:00.000Z'));

  assert.equal(start.toISOString(), '2026-04-30T17:00:00.000Z');
  assert.equal(end.toISOString(), '2026-05-31T17:00:00.000Z');
});

test('assertCouponUsageAllowed checks KHACHMOI by account only', async () => {
  let recordedWhere = null;

  await assert.rejects(
    assertCouponUsageAllowed({
      Booking: {
        findOne: async ({ where }) => {
          recordedWhere = where;
          return { id: 101 };
        },
      },
      userId: 7,
      code: KHACHMOI_CODE,
    }),
    /KHACHMOI/,
  );

  assert.equal(recordedWhere.user_id, 7);
  assert.equal(recordedWhere.coupon_code, KHACHMOI_CODE);
  assert.deepEqual(recordedWhere.status[Op.notIn], ['expired']);
});

test('assertCouponUsageAllowed scopes THANGMOI to the current month', async () => {
  let recordedWhere = null;

  await assert.rejects(
    assertCouponUsageAllowed({
      Booking: {
        findOne: async ({ where }) => {
          recordedWhere = where;
          return { id: 202 };
        },
      },
      userId: 9,
      code: THANGMOI_CODE,
      now: new Date('2026-05-14T08:00:00.000Z'),
    }),
    /THANGMOI/,
  );

  assert.equal(recordedWhere.user_id, 9);
  assert.equal(recordedWhere.coupon_code, THANGMOI_CODE);
  assert.equal(recordedWhere.createdAt[Op.gte].toISOString(), '2026-04-30T17:00:00.000Z');
  assert.equal(recordedWhere.createdAt[Op.lt].toISOString(), '2026-05-31T17:00:00.000Z');
});

test('assertCouponUsageAllowed allows unrestricted or unused coupons', async () => {
  await assert.doesNotReject(() =>
    assertCouponUsageAllowed({
      Booking: {
        findOne: async () => null,
      },
      userId: 3,
      code: 'GIAM50',
    }),
  );
});

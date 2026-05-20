const test = require('node:test');
const assert = require('node:assert/strict');

const {
  SERIES_APPROVAL_STATUS,
} = require('../utils/recurringBookingTypes');
const {
  resolveApprovalStatus,
  validateDepositAmount,
  buildWeeklyOccurrences,
  buildMonthlyOccurrences,
} = require('../utils/recurringBookingService');

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

test('buildWeeklyOccurrences creates a full weekly series between start and end date', () => {
  const rows = buildWeeklyOccurrences({
    startDate: '2026-05-01',
    endDate: '2026-05-29',
    weekday: 5,
    startTime: '18:00',
    endTime: '19:00',
  });

  assert.equal(rows.length, 5);
  assert.equal(rows[0].scheduledDate, '2026-05-01');
  assert.equal(rows[4].scheduledDate, '2026-05-29');
});

test('buildMonthlyOccurrences keeps the same day-of-month cadence', () => {
  const rows = buildMonthlyOccurrences({
    startDate: '2026-05-20',
    occurrenceCount: 3,
    startTime: '18:00',
    endTime: '19:00',
  });

  assert.deepEqual(
    rows.map((row) => row.scheduledDate),
    ['2026-05-20', '2026-06-20', '2026-07-20']
  );
});

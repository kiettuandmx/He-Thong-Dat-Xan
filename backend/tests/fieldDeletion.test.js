const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getFieldDeletionGuard,
  FIELD_DELETION_BLOCKED_MESSAGE,
} = require('../utils/fieldDeletion');

test('getFieldDeletionGuard blocks hard delete when field has booking history', () => {
  const result = getFieldDeletionGuard({ bookingCount: 1 });

  assert.equal(result.canDelete, false);
  assert.equal(result.statusCode, 409);
  assert.equal(result.error, FIELD_DELETION_BLOCKED_MESSAGE);
});

test('getFieldDeletionGuard allows hard delete when field has no bookings', () => {
  const result = getFieldDeletionGuard({ bookingCount: 0 });

  assert.equal(result.canDelete, true);
  assert.equal(result.statusCode, null);
  assert.equal(result.error, null);
});

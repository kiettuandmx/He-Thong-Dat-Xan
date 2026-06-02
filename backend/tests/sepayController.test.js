const test = require('node:test');
const assert = require('node:assert/strict');

const { __testables } = require('../controllers/sepayController');

test('isWebhookAuthorized accepts SePay API Key authorization header', () => {
  process.env.SEPAY_WEBHOOK_SECRET = 'sbook-sepay-2026';

  const req = {
    headers: {
      authorization: 'Apikey sbook-sepay-2026',
    },
  };

  assert.equal(__testables.isWebhookAuthorized(req), true);
});

test('isWebhookAuthorized accepts plain authorization header fallback', () => {
  process.env.SEPAY_WEBHOOK_SECRET = 'sbook-sepay-2026';

  const req = {
    headers: {
      authorization: 'sbook-sepay-2026',
    },
  };

  assert.equal(__testables.isWebhookAuthorized(req), true);
});


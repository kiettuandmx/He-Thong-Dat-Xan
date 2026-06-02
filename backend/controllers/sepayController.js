const db = require('../models');
const { getIO } = require('../socket');
const { createNotification } = require('../utils/notificationHelper');
const { reconcileSePayBookingTransfer } = require('../services/sepayBookingService');

function isWebhookAuthorized(req) {
  const expectedSecret = String(process.env.SEPAY_WEBHOOK_SECRET || '').trim();
  if (!expectedSecret) {
    return true;
  }

  const authorizationHeader = String(req.headers.authorization || '').trim();
  const providedSecret = String(
    req.headers['x-sepay-secret'] ||
      req.headers['x-sepay-signature'] ||
      authorizationHeader.replace(/^(Bearer|Apikey)\s+/i, '') ||
      authorizationHeader ||
      ''
  ).trim();

  return providedSecret === expectedSecret;
}

exports.handleSePayWebhook = async (req, res) => {
  try {
    if (!isWebhookAuthorized(req)) {
      return res.status(401).json({ success: false, message: 'Webhook SePay khong hop le.' });
    }

    await reconcileSePayBookingTransfer({
      db,
      payload: req.body,
      notify: createNotification,
      emitSlotConfirmed: (payload) => {
        const io = getIO();
        io.emit('slotConfirmed', payload);
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('SePay webhook error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.__testables = {
  isWebhookAuthorized,
};

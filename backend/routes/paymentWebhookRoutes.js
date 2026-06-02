const express = require('express');
const { handleSePayWebhook } = require('../controllers/sepayController');

const router = express.Router();

router.post('/sepay/webhook', handleSePayWebhook);

module.exports = router;

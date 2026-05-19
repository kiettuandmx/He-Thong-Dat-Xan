const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

router.get('/summary', verifyToken, walletController.getWalletSummary);
router.get('/transactions', verifyToken, walletController.getWalletTransactions);
router.post('/top-up', verifyToken, walletController.topUp);
router.post('/withdraw', verifyToken, walletController.withdraw);

module.exports = router;

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/owner/stats/:ownerId', verifyToken, dashboardController.getOwnerStats);

module.exports = router;

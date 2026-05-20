const express = require('express');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const foodOrderController = require('../controllers/foodOrderController');

const router = express.Router();

router.post('/bookings/:bookingId/orders', verifyToken, foodOrderController.createFoodOrder);
router.get('/bookings/:bookingId/orders', verifyToken, foodOrderController.listFoodOrdersForBooking);
router.put('/orders/:id/status', verifyToken, checkRole([2]), foodOrderController.updateFoodOrderStatus);

module.exports = router;

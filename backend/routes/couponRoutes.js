const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Admin routes
router.post('/', verifyToken, checkRole(['admin']), couponController.createCoupon);
router.get('/', verifyToken, checkRole(['admin']), couponController.getCoupons);
router.put('/:id', verifyToken, checkRole(['admin']), couponController.updateCoupon);
router.delete('/:id', verifyToken, checkRole(['admin']), couponController.deleteCoupon);

// Public routes
router.get('/code/:code', couponController.getCouponByCode);
router.post('/validate', couponController.validateCoupon);
router.post('/assign-monthly', verifyToken, checkRole(['admin']), couponController.assignMonthlyCoupon);
router.post('/assign-new-customer', verifyToken, checkRole(['admin']), couponController.assignNewCustomerCoupon);

module.exports = router;
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController'); 
const { verifyToken } = require('../middleware/authMiddleware');

// --- 1. CÁC ROUTE CÓ CHỮ CỐ ĐỊNH (PHẢI LÊN TRÊN CÙNG) ---
router.post('/book', verifyToken, bookingController.createBooking);
router.get('/history', verifyToken, bookingController.getUserHistory);
router.get('/notifications', verifyToken, bookingController.getNotifications);
router.put('/notifications/read', verifyToken, bookingController.markAsRead);
// --- 2. CÁC ROUTE CÓ TIỀN TỐ (OWNER) ---
router.get('/owner/:ownerId', verifyToken, bookingController.getOwnerBookings);
router.get('/analytics/:stadiumId', verifyToken, bookingController.getStadiumAnalytics);

// --- 3. CÁC ROUTE CÓ HÀNH ĐỘNG VỚI ID (PUT/PATCH/POST) ---
router.put('/approve/:id', verifyToken, bookingController.approveBooking);
router.patch('/reject/:id', verifyToken, bookingController.rejectBooking);
router.put('/cancel/:id', verifyToken, bookingController.cancelBooking);
router.put('/refund/:id', verifyToken, bookingController.refundBooking);
router.put('/update-payment/:bookingId', verifyToken, bookingController.updatePaymentStatus);

// --- 4. WILD CARD CUỐI CÙNG ---
router.get('/:id', verifyToken, bookingController.getBookingById);

module.exports = router;
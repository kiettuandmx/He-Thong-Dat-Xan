const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/book', verifyToken, bookingController.createBooking);
router.get('/history', verifyToken, bookingController.getUserHistory);
router.get('/payment-history', verifyToken, bookingController.getUserPaymentHistory);
router.get('/notifications', verifyToken, bookingController.getNotifications);
router.put('/notifications/read', verifyToken, bookingController.markAsRead);
router.put('/notifications/:notificationId/read', verifyToken, bookingController.markSingleNotificationAsRead);

router.get('/refund-history', verifyToken, bookingController.getRefundHistory);
router.get('/owner/payment-history', verifyToken, bookingController.getOwnerPaymentHistory);
router.get('/owner/:ownerId', verifyToken, bookingController.getOwnerBookings);
router.get('/analytics/:stadiumId', verifyToken, bookingController.getStadiumAnalytics);
router.get('/admin/refund-history', verifyToken, bookingController.getAdminRefundHistory);

router.put('/approve/:id', verifyToken, bookingController.approveBooking);
router.patch('/reject/:id', verifyToken, bookingController.rejectBooking);
router.put('/cancel/:id', verifyToken, bookingController.cancelBooking);
router.put('/refund/:id', verifyToken, bookingController.refundBooking);
router.put('/update-payment/:bookingId', verifyToken, bookingController.updatePaymentStatus);

router.get('/:id', verifyToken, bookingController.getBookingById);

module.exports = router;

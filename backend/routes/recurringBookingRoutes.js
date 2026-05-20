const express = require('express');
const recurringBookingController = require('../controllers/recurringBookingController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/preview', verifyToken, recurringBookingController.previewRecurringBooking);
router.post('/', verifyToken, recurringBookingController.createRecurringBooking);
router.get('/mine', verifyToken, recurringBookingController.getMyRecurringBookings);
router.get(
  '/owner/pending',
  verifyToken,
  checkRole([2]),
  recurringBookingController.getOwnerRecurringBookings
);
router.put(
  '/owner/:id/approve',
  verifyToken,
  checkRole([2]),
  recurringBookingController.approveRecurringBooking
);
router.put(
  '/owner/:id/reject',
  verifyToken,
  checkRole([2]),
  recurringBookingController.rejectRecurringBooking
);

module.exports = router;

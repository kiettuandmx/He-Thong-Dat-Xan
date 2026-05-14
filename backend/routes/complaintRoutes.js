const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.post('/', verifyToken, complaintController.createComplaint);
router.get('/my', verifyToken, complaintController.getMyComplaints);
router.get('/admin/all', verifyToken, checkRole([3, 'admin', 'ADMIN']), complaintController.getAdminComplaints);
router.get('/admin/:id', verifyToken, checkRole([3, 'admin', 'ADMIN']), complaintController.getAdminComplaintById);
router.get('/admin/:id/activity-context', verifyToken, checkRole([3, 'admin', 'ADMIN']), complaintController.getComplaintActivityContext);
router.patch('/admin/:id/status', verifyToken, checkRole([3, 'admin', 'ADMIN']), complaintController.updateComplaintStatus);
router.post('/admin/:id/resolve', verifyToken, checkRole([3, 'admin', 'ADMIN']), complaintController.resolveComplaint);

module.exports = router;

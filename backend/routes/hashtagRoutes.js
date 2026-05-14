const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hashtagController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public: Xem danh sách hashtag
router.get('/', ctrl.getAll);

// Admin: Quản lý hashtag (role_id 3 = Admin)
router.post('/', verifyToken, checkRole([3]), ctrl.create);
router.put('/:id', verifyToken, checkRole([3]), ctrl.update);
router.delete('/:id', verifyToken, checkRole([3]), ctrl.remove);

// Admin + Owner: Gán hashtag cho sân
router.put('/stadium/:id/hashtags', verifyToken, checkRole([2, 3]), ctrl.setStadiumHashtags);

module.exports = router;

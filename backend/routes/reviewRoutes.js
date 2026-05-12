const express = require('express');
const router = express.Router();
// 1. Lấy cả 2 hàm ra từ controller
const { createReview, getOwnerReviews, getUserReviews, replyToReview } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware'); 

// 2. Gọi trực tiếp tên hàm, không dùng reviewController. nữa
router.get('/owner', verifyToken, getOwnerReviews);
router.get('/my-reviews', verifyToken, getUserReviews);
router.post('/create', verifyToken, createReview); 
router.patch('/:id/reply', verifyToken, replyToReview); 

module.exports = router;
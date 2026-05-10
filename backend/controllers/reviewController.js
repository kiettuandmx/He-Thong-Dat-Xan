const { Review, Booking, Stadium, Field, User } = require('../models');

const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    const user_id = req.user.id; 

    // 1. Kiểm tra đơn đặt sân có tồn tại không
    const booking = await Booking.findOne({ 
      where: { id: booking_id, user_id } 
    });
    
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt sân hợp lệ để đánh giá!" });
    }

    // 2. Tạo đánh giá mới
    const newReview = await Review.create({
      user_id,
      booking_id,
      stadium_id: booking.stadium_id,
      field_id: booking.field_id,
      rating: Number(rating), // Ép kiểu số cho chắc chắn
      comment: comment || ""
    });

    return res.status(201).json({ 
      message: "Gửi đánh giá thành công!", 
      data: newReview 
    });

  } catch (err) {
    console.error("Lỗi Backend Chi Tiết:", err); // Dòng này cực quan trọng để Lâm xem lỗi ở Terminal
    return res.status(500).json({ 
      message: "Lỗi hệ thống khi lưu đánh giá: " + err.message 
    });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const user_id = req.user.id; 

    const reviews = await Review.findAll({
      where: { user_id },
      include: [
        {
          model: Field,
          as: 'field',
          include: [{ model: Stadium, as: 'stadium' }] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(reviews);
  } catch (err) {
    console.error("Lỗi association:", err);
    res.status(500).json({ message: "Lỗi: " + err.message });
  }
};

// Backend Controller
const getOwnerReviews = async (req, res) => {
  try {
    const owner_id = req.user.id; 

    const reviews = await Review.findAll({
      include: [
        {
          model: Field,
          as: 'field',
          required: true,
          include: [
            {
              model: Stadium,
              as: 'stadium',
              where: { owner_id: owner_id },
              required: true
            }
          ]
        },
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'name', 'email'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(reviews);
  } catch (err) {
    console.error("Lỗi lấy review:", err);
    res.status(500).json({ message: err.message });
  }
};

const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_reply } = req.body;
    const owner_id = req.user.id;

    // 1. Tìm đánh giá và kiểm tra quyền (Phải là chủ của sân/stadium đó)
    const review = await Review.findByPk(id, {
      include: [{
        model: Field,
        as: 'field',
        include: [{ model: Stadium, as: 'stadium' }]
      }]
    });

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá!" });
    }

    if (review.field.stadium.owner_id !== owner_id) {
      return res.status(403).json({ message: "Bạn không có quyền phản hồi đánh giá này!" });
    }

    // 2. Cập nhật phản hồi
    review.owner_reply = owner_reply;
    await review.save();

    res.status(200).json({ message: "Gửi phản hồi thành công!", data: review });
  } catch (err) {
    console.error("Lỗi phản hồi đánh giá:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReview, getOwnerReviews, getUserReviews, replyToReview };
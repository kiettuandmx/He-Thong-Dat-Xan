const { Coupon, User, Booking } = require('../models');
const { Op } = require('sequelize'); // Import Op để dùng cho các phép so sánh

// 1. VALIDATE COUPON - Sửa lỗi tính toán và ép kiểu
exports.validateCoupon = async (req, res) => {
  try {
    let { code, user_id, total_price } = req.body;

    const currentPrice = parseFloat(total_price);
    const validUserId = user_id || null;

    if (isNaN(currentPrice) || currentPrice <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    const coupon = await Coupon.findOne({
      where: {
        code: code,
        is_active: true,
        [Op.or]: [
          { user_id: null },
          { user_id: validUserId }
        ]
      }
    });

    if (!coupon) {
      return res.status(400).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
    }

    // CHẶN DÙNG LẠI MÃ
    if (validUserId) {
      // 1. Chặn KHACHMOI: Dùng 1 lần duy nhất trong đời
      if (coupon.code === 'KHACHMOI') {
        const usedKHACHMOI = await Booking.findOne({
          where: { 
            user_id: validUserId, 
            coupon_code: 'KHACHMOI',
            status: { [Op.notIn]: ['cancelled', 'expired'] } 
          }
        });
        if (usedKHACHMOI) {
          return res.status(400).json({ message: 'Bạn đã từng sử dụng mã KHACHMOI rồi!' });
        }
      }

      // 2. Chặn THANGMOI: Mỗi tháng 1 lần
      if (coupon.code === 'THANGMOI') {
        const now = new Date();
        // Lấy chính xác thời điểm 00:00:00 ngày 1 của tháng hiện tại
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        // Lấy chính xác thời điểm 23:59:59 ngày cuối cùng của tháng hiện tại
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const usedTHANGMOI = await Booking.findOne({
          where: {
            user_id: validUserId,
            coupon_code: 'THANGMOI',
            createdAt: { [Op.between]: [startOfMonth, endOfMonth] },
            status: { [Op.notIn]: ['cancelled', 'expired'] }
          }
        });
        if (usedTHANGMOI) {
          return res.status(400).json({ message: 'Mã THANGMOI tháng này bạn đã dùng rồi, hãy quay lại vào tháng sau nhé!' });
        }
      }
    }

    // KIỂM TRA HẠN SỬ DỤNG CHUNG (Dành cho các mã có ngày hết hạn)
    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
        return res.status(400).json({ message: 'Mã giảm giá này đã hết hạn sử dụng' });
    }

    // TÍNH TOÁN SỐ TIỀN GIẢM
    let discount_amount = 0;
    const val = parseFloat(coupon.discount_value);

    if (coupon.discount_type === 'percentage') {
      discount_amount = (currentPrice * val) / 100;
    } else {
      discount_amount = val;
    }

    discount_amount = Math.round(discount_amount);

    res.json({
      valid: true,
      discount_amount: Math.min(discount_amount, currentPrice),
      final_price: currentPrice - Math.min(discount_amount, currentPrice),
      coupon
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra mã' });
  }
};
// 2. ASSIGN MONTHLY COUPON - Sửa logic thời gian cho chính xác
exports.assignMonthlyCoupon = async (req, res) => {
  try {
    const { user_id } = req.body;
    const now = new Date();
    
    // Lấy ngày đầu tháng và đầu tháng sau
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const existingCoupon = await Coupon.findOne({
      where: {
        code: 'THANGMOI',
        user_id,
        createdAt: {
          [Op.gte]: firstDayOfMonth,
          [Op.lt]: firstDayOfNextMonth
        }
      }
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'Bạn đã nhận mã THANGMOI của tháng này rồi' });
    }

    const coupon = await Coupon.create({
      code: 'THANGMOI',
      discount_type: 'percentage',
      discount_value: 20, // 20%
      usage_limit: 1,
      used_count: 0,
      expires_at: firstDayOfNextMonth, 
      is_active: true,
      description: `Mã giảm giá tháng ${now.getMonth() + 1} cho khách hàng thân thiết`,
      user_id
    });

    res.status(201).json({ message: 'Đã tặng mã giảm giá tháng mới thành công', coupon });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Không thể cấp mã tháng' });
  }
};

// 3. CREATE COUPON - Thêm giá trị mặc định cho used_count
exports.createCoupon = async (req, res) => {
  try {
    const data = req.body;
    // Đảm bảo mã luôn in hoa để dễ quản lý
    if(data.code) data.code = data.code.toUpperCase();
    
    const coupon = await Coupon.create({
      ...data,
      used_count: 0 // Khởi tạo luôn là 0
    });

    res.status(201).json({ message: 'Tạo mã thành công', coupon });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo mã' });
  }
};
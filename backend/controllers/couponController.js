const { Op } = require('sequelize');
const { Coupon, User, Booking } = require('../models');
const {
  THANGMOI_CODE,
  normalizeCouponCode,
  getMonthRange,
  assertCouponUsageAllowed,
} = require('../utils/couponUsage');

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      usage_limit,
      expires_at,
      description,
      user_id,
    } = req.body;

    const coupon = await Coupon.create({
      code: normalizeCouponCode(code),
      discount_type,
      discount_value,
      usage_limit,
      expires_at,
      description,
      user_id,
    });

    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
    });
    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({
      where: { code: normalizeCouponCode(code), is_active: true },
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json(coupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.code) {
      updates.code = normalizeCouponCode(updates.code);
    }

    const [updated] = await Coupon.update(updates, { where: { id } });
    if (!updated) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const coupon = await Coupon.findByPk(id);
    res.json({ message: 'Coupon updated successfully', coupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, user_id, total_price } = req.body;
    const normalizedCode = normalizeCouponCode(code);

    const coupon = await Coupon.findOne({
      where: {
        code: normalizedCode,
        is_active: true,
        [Op.or]: [{ user_id: null }, { user_id }],
      },
    });

    if (!coupon) {
      return res.status(400).json({ message: 'Invalid coupon code' });
    }

    try {
      await assertCouponUsageAllowed({
        Booking,
        userId: user_id,
        code: normalizedCode,
      });
    } catch (usageError) {
      return res.status(400).json({ message: usageError.message });
    }

    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'Coupon usage limit exceeded' });
    }

    let discount_amount = 0;
    if (coupon.discount_type === 'percentage') {
      discount_amount = (parseFloat(total_price) * parseFloat(coupon.discount_value)) / 100;
    } else {
      discount_amount = parseFloat(coupon.discount_value);
    }

    res.json({
      valid: true,
      discount_amount: Math.min(discount_amount, parseFloat(total_price)),
      coupon,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.assignMonthlyCoupon = async (req, res) => {
  try {
    const { user_id } = req.body;
    const { start: currentMonth, end: nextMonth } = getMonthRange();

    const existingCoupon = await Coupon.findOne({
      where: {
        code: THANGMOI_CODE,
        user_id,
        createdAt: {
          [Op.gte]: currentMonth,
          [Op.lt]: nextMonth,
        },
      },
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'User da nhan coupon THANGMOI trong thang nay' });
    }

    const coupon = await Coupon.create({
      code: THANGMOI_CODE,
      discount_type: 'percentage',
      discount_value: 20.0,
      usage_limit: 1,
      used_count: 0,
      expires_at: nextMonth,
      is_active: true,
      description: 'Giam 20% moi thang dung mot lan',
      user_id,
    });

    res.status(201).json({ message: 'Coupon THANGMOI da duoc assign cho user', coupon });
  } catch (error) {
    console.error('Error assigning monthly coupon:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

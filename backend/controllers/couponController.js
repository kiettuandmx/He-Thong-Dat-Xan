const { Coupon, User, Booking } = require("../models");
const { Op } = require("sequelize");
const {
  normalizeCouponCode,
  findValidCoupon,
  calculateDiscountAmount,
} = require("../utils/couponUtils");

const couponUserInclude = {
  model: User,
  as: "user",
  attributes: ["id", "name", "email"],
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, user_id, total_price } = req.body;
    const normalizedCode = normalizeCouponCode(code);
    const currentPrice = parseFloat(total_price);
    const validUserId = user_id || null;

    if (!normalizedCode) {
      return res.status(400).json({ message: "Ma giam gia khong hop le" });
    }

    if (Number.isNaN(currentPrice) || currentPrice <= 0) {
      return res.status(400).json({ message: "So tien khong hop le" });
    }

    const { coupon, error } = await findValidCoupon({
      Coupon,
      Booking,
      code: normalizedCode,
      userId: validUserId,
    });

    if (error) {
      return res.status(400).json({ message: error });
    }

    const discountAmount = calculateDiscountAmount(coupon, currentPrice);

    res.json({
      valid: true,
      discount_amount: discountAmount,
      final_price: currentPrice - discountAmount,
      coupon,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Loi he thong khi kiem tra ma" });
  }
};

exports.assignMonthlyCoupon = async (req, res) => {
  try {
    const { user_id } = req.body;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const existingCoupon = await Coupon.findOne({
      where: {
        code: "THANGMOI",
        user_id,
        createdAt: {
          [Op.gte]: firstDayOfMonth,
          [Op.lt]: firstDayOfNextMonth,
        },
      },
    });

    if (existingCoupon) {
      return res
        .status(400)
        .json({ message: "Ban da nhan ma THANGMOI cua thang nay roi" });
    }

    const coupon = await Coupon.create({
      code: "THANGMOI",
      discount_type: "percentage",
      discount_value: 20,
      usage_limit: 1,
      used_count: 0,
      expires_at: firstDayOfNextMonth,
      is_active: true,
      description: `Ma giam gia thang ${now.getMonth() + 1} cho khach hang than thiet`,
      user_id,
    });

    res.status(201).json({
      message: "Da tang ma giam gia thang moi thanh cong",
      coupon,
    });
  } catch (error) {
    console.error("Error assigning monthly coupon:", error);
    res.status(500).json({ message: "Khong the cap ma thang" });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.code) {
      data.code = data.code.toUpperCase();
    }

    const coupon = await Coupon.create({
      ...data,
      used_count: 0,
    });

    res.status(201).json({ message: "Tao ma thanh cong", coupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Loi khi tao ma" });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({
      include: [couponUserInclude],
      order: [["createdAt", "DESC"]],
    });

    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Loi khi lay danh sach ma" });
  }
};

exports.getCouponByCode = async (req, res) => {
  try {
    const normalizedCode = req.params.code.toUpperCase();
    const coupon = await Coupon.findOne({
      where: { code: normalizedCode },
      include: [couponUserInclude],
    });

    if (!coupon) {
      return res.status(404).json({ message: "Khong tim thay ma giam gia" });
    }

    res.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon by code:", error);
    res.status(500).json({ message: "Loi khi lay ma giam gia" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.code) {
      data.code = data.code.toUpperCase();
    }

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({ message: "Khong tim thay ma giam gia" });
    }

    await coupon.update(data);

    res.json({ message: "Cap nhat ma thanh cong", coupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: "Loi khi cap nhat ma" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({ message: "Khong tim thay ma giam gia" });
    }

    await coupon.destroy();

    res.json({ message: "Xoa ma thanh cong" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Loi khi xoa ma" });
  }
};

exports.assignNewCustomerCoupon = async (req, res) => {
  try {
    const { user_id } = req.body;

    // Kiểm tra xem user đã nhận KHACHMOI chưa
    const existingCoupon = await Coupon.findOne({
      where: {
        code: "KHACHMOI",
        user_id,
      },
    });

    if (existingCoupon) {
      return res
        .status(400)
        .json({ message: "Ban da nhan ma KHACHMOI roi" });
    }

    // Kiểm tra xem KHACHMOI coupon có tồn tại không
    const khachmoiCoupon = await Coupon.findOne({
      where: {
        code: "KHACHMOI",
        user_id: null,
      },
    });

    if (!khachmoiCoupon) {
      return res
        .status(400)
        .json({ message: "Ma KHACHMOI chua duoc khoi tao" });
    }

    // Tạo bản sao coupon cho user
    const coupon = await Coupon.create({
      code: "KHACHMOI",
      discount_type: khachmoiCoupon.discount_type,
      discount_value: khachmoiCoupon.discount_value,
      usage_limit: 1,
      used_count: 0,
      expires_at: null,
      is_active: true,
      description: `Ma giam gia cho khach hang moi ${new Date().getFullYear()}`,
      user_id,
    });

    res.status(201).json({
      message: "Da cap ma giam gia KHACHMOI thanh cong",
      coupon,
    });
  } catch (error) {
    console.error("Error assigning new customer coupon:", error);
    res.status(500).json({ message: "Khong the cap ma KHACHMOI" });
  }
};

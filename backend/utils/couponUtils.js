const { Op } = require("sequelize");

function normalizeCouponCode(code) {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

async function findValidCoupon({
  Coupon,
  Booking,
  code,
  userId,
  transaction,
}) {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) {
    return { error: "Mã giảm giá không hợp lệ" };
  }

  const coupon = await Coupon.findOne({
    where: {
      code: normalizedCode,
      is_active: true,
      [Op.or]: [{ user_id: null }, { user_id: userId || null }],
    },
    transaction,
  });

  if (!coupon) {
    return { error: "Mã giảm giá không tồn tại hoặc đã hết hạn" };
  }

  if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
    return { error: "Ma giam gia da het han" };
  }

  if (
    Number.isInteger(coupon.usage_limit) &&
    coupon.usage_limit > 0 &&
    coupon.used_count >= coupon.usage_limit
  ) {
    return { error: "Ma giam gia da het luot su dung" };
  }

  if (userId && normalizedCode === "KHACHMOI") {
    const usedNewCustomerCoupon = await Booking.findOne({
      where: {
        user_id: userId,
        coupon_code: "KHACHMOI",
        status: { [Op.notIn]: ["cancelled", "expired"] },
      },
      transaction,
    });

    if (usedNewCustomerCoupon) {
      return { error: "Ban da dung ma KHACHMOI roi" };
    }
  }

  if (userId && normalizedCode === "THANGMOI") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const usedMonthlyCoupon = await Booking.findOne({
      where: {
        user_id: userId,
        coupon_code: "THANGMOI",
        createdAt: {
          [Op.gte]: startOfMonth,
          [Op.lt]: firstDayOfNextMonth,
        },
        status: { [Op.notIn]: ["cancelled", "expired"] },
      },
      transaction,
    });

    if (usedMonthlyCoupon) {
      return { error: "Ma THANGMOI trong thang nay da duoc su dung" };
    }
  }

  return { coupon };
}

function calculateDiscountAmount(coupon, totalPrice) {
  const numericTotalPrice = Math.max(0, Number(totalPrice) || 0);
  const discountValue = parseFloat(coupon.discount_value);

  if (!coupon || Number.isNaN(discountValue)) {
    return 0;
  }

  const rawDiscount =
    coupon.discount_type === "percentage"
      ? (numericTotalPrice * discountValue) / 100
      : discountValue;

  return Math.min(Math.round(rawDiscount), numericTotalPrice);
}

module.exports = {
  normalizeCouponCode,
  findValidCoupon,
  calculateDiscountAmount,
};

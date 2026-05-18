const { Op } = require('sequelize');

const KHACHMOI_CODE = 'KHACHMOI';
const THANGMOI_CODE = 'THANGMOI';
const NON_CONSUMING_STATUSES = ['expired'];

const normalizeCouponCode = (code) => String(code || '').trim().toUpperCase();

const getMonthRange = (date = new Date()) => {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return { start, end };
};

const getCouponUsageMessage = (code) => {
  switch (normalizeCouponCode(code)) {
    case KHACHMOI_CODE:
      return 'Bạn chỉ được dùng mã KHACHMOI một lần cho tài khoản này';
    case THANGMOI_CODE:
      return 'Ban chi duoc dung ma THANGMOI mot lan trong moi thang';
    default:
      return 'Mã giảm giá không còn hợp lệ với tài khoản này';
  }
};

const buildCouponUsageWhere = (userId, code, now = new Date()) => {
  const normalizedCode = normalizeCouponCode(code);
  const where = {
    user_id: userId,
    coupon_code: normalizedCode,
    status: {
      [Op.notIn]: NON_CONSUMING_STATUSES,
    },
  };

  if (normalizedCode === THANGMOI_CODE) {
    const { start, end } = getMonthRange(now);
    where.createdAt = {
      [Op.gte]: start,
      [Op.lt]: end,
    };
  }

  return where;
};

const isRestrictedCoupon = (code) =>
  [KHACHMOI_CODE, THANGMOI_CODE].includes(normalizeCouponCode(code));

const assertCouponUsageAllowed = async ({
  Booking,
  userId,
  code,
  now = new Date(),
  transaction,
}) => {
  const normalizedCode = normalizeCouponCode(code);

  if (!userId || !isRestrictedCoupon(normalizedCode)) {
    return normalizedCode;
  }

  const existingBooking = await Booking.findOne({
    where: buildCouponUsageWhere(userId, normalizedCode, now),
    transaction,
  });

  if (existingBooking) {
    throw new Error(getCouponUsageMessage(normalizedCode));
  }

  return normalizedCode;
};

module.exports = {
  KHACHMOI_CODE,
  THANGMOI_CODE,
  normalizeCouponCode,
  getMonthRange,
  getCouponUsageMessage,
  assertCouponUsageAllowed,
};

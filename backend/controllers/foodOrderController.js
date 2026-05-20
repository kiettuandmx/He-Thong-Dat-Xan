const db = require('../models');
const {
  createFoodOrderForBooking,
  listFoodOrdersForBooking,
  updateFoodOrderStatusByOwner,
} = require('../utils/foodOrderService');

const mapFoodOrderError = (error) => {
  switch (error.message) {
    case 'BOOKING_NOT_FOUND':
      return { status: 404, message: 'Khong tim thay booking.' };
    case 'FOOD_ORDER_NOT_FOUND':
      return { status: 404, message: 'Khong tim thay order mon.' };
    case 'FORBIDDEN_FOOD_ORDER_ACCESS':
      return { status: 403, message: 'Ban khong co quyen truy cap du lieu nay.' };
    case 'FOOD_ORDER_WINDOW_CLOSED':
      return { status: 400, message: 'Da het khung gio cho phep order mon.' };
    case 'MENU_ITEM_UNAVAILABLE':
      return { status: 400, message: 'Mot hoac nhieu mon da het hoac khong hop le.' };
    case 'INVALID_FOOD_ORDER_STATUS_TRANSITION':
      return { status: 400, message: 'Khong the chuyen trang thai order theo cach nay.' };
    default:
      return null;
  }
};

exports.createFoodOrder = async (req, res) => {
  try {
    const foodOrder = await createFoodOrderForBooking(db, {
      bookingId: Number(req.params.bookingId),
      userId: req.user.id,
      role: req.user.role,
      items: Array.isArray(req.body.items) ? req.body.items : [],
      paymentMethod: req.body.payment_method || null,
    });

    return res.status(201).json({ success: true, data: foodOrder });
  } catch (error) {
    const mapped = mapFoodOrderError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.listFoodOrdersForBooking = async (req, res) => {
  try {
    const rows = await listFoodOrdersForBooking(db, {
      bookingId: Number(req.params.bookingId),
      userId: req.user.id,
      role: req.user.role,
    });

    return res.json({ success: true, data: rows });
  } catch (error) {
    const mapped = mapFoodOrderError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFoodOrderStatus = async (req, res) => {
  try {
    const updated = await updateFoodOrderStatusByOwner(db, {
      foodOrderId: Number(req.params.id),
      ownerId: req.user.id,
      role: req.user.role,
      status: req.body.status,
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    const mapped = mapFoodOrderError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

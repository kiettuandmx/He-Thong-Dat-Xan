const db = require('../models');
const { createMenuItem, listFieldMenu } = require('../utils/foodOrderService');

const mapMenuError = (error) => {
  switch (error.message) {
    case 'FIELD_NOT_FOUND':
      return { status: 404, message: 'Khong tim thay san.' };
    case 'FORBIDDEN_FOOD_ORDER_ACCESS':
      return { status: 403, message: 'Ban khong co quyen quan ly menu nay.' };
    default:
      return null;
  }
};

exports.getFieldMenu = async (req, res) => {
  try {
    const rows = await listFieldMenu(db, Number(req.params.fieldId));
    return res.json({ success: true, data: rows });
  } catch (error) {
    const mapped = mapMenuError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const row = await createMenuItem(db, {
      fieldId: Number(req.params.fieldId),
      ownerId: req.user.id,
      role: req.user.role,
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      isAvailable: req.body.is_available,
    });

    return res.status(201).json({ success: true, data: row });
  } catch (error) {
    const mapped = mapMenuError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

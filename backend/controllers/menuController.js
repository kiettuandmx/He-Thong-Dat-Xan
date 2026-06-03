const db = require('../models');
const {
  createMenuItem,
  listStadiumMenu,
  updateMenuItemByOwner,
  deleteMenuItemByOwner,
  setMenuItemAvailabilityByOwner,
} = require('../utils/foodOrderService');

const mapMenuError = (error) => {
  switch (error.message) {
    case 'STADIUM_NOT_FOUND':
      return { status: 404, message: 'Khong tim thay khu san.' };
    case 'FORBIDDEN_FOOD_ORDER_ACCESS':
      return { status: 403, message: 'Ban khong co quyen quan ly menu nay.' };
    case 'MENU_ITEM_NOT_FOUND':
      return { status: 404, message: 'Khong tim thay mon.' };
    default:
      return null;
  }
};

exports.getStadiumMenu = async (req, res) => {
  try {
    const rows = await listStadiumMenu(db, Number(req.params.stadiumId));
    return res.json({ success: true, data: rows });
  } catch (error) {
    const mapped = mapMenuError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const row = await updateMenuItemByOwner(db, {
      menuItemId: Number(req.params.id),
      ownerId: req.user.id,
      role: req.user.role,
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      isAvailable: req.body.is_available,
    });

    return res.json({ success: true, data: row });
  } catch (error) {
    const mapped = mapMenuError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMenuItemAvailability = async (req, res) => {
  try {
    const row = await setMenuItemAvailabilityByOwner(db, {
      menuItemId: Number(req.params.id),
      ownerId: req.user.id,
      role: req.user.role,
      isAvailable: req.body.is_available,
    });

    return res.json({ success: true, data: row });
  } catch (error) {
    const mapped = mapMenuError(error);
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const row = await deleteMenuItemByOwner(db, {
      menuItemId: Number(req.params.id),
      ownerId: req.user.id,
      role: req.user.role,
    });

    return res.json({ success: true, data: row });
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
      stadiumId: Number(req.params.stadiumId),
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

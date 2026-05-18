const express = require("express");
const { Op, Sequelize } = require("sequelize");
const upload = require("../middleware/upload");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const { logAdminActivity } = require("../utils/adminActivityLogger");
const {
  getFieldTypeVariants,
  isValidFieldType,
  normalizeFieldType,
} = require("../utils/fieldTypes");
const { getFieldDeletionGuard } = require("../utils/fieldDeletion");
const {
  Field,
  Stadium,
  Location,
  FieldImage,
  Schedule,
  Review,
  Booking,
  User,
  Favorite,
} = require("../models");

const router = express.Router();

const getRequestMeta = (req) => ({
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

const toPlain = (instance) => (instance ? instance.get({ plain: true }) : null);
const isAdminUser = (req) => Number(req.user?.role) === 3;

const ensureStadiumAccess = async (req, stadiumId) => {
  if (isAdminUser(req)) return true;
  const stadium = await Stadium.findByPk(stadiumId);
  return Number(stadium?.owner_id) === Number(req.user?.id);
};

const ensureFieldAccess = async (req, field) => {
  if (isAdminUser(req)) return true;
  const stadium = await Stadium.findByPk(field.stadium_id);
  return Number(stadium?.owner_id) === Number(req.user?.id);
};

router.get("/fields", async (req, res) => {
  try {
    const { type } = req.query;
    const condition = { status: "active" };

    if (type && type !== "Tất cả" && type !== "Trang chủ") {
      const typeVariants = getFieldTypeVariants(type);
      if (typeVariants.length > 0) {
        condition.type = { [Op.in]: typeVariants };
      }
    }

    const fields = await Field.findAll({
      where: condition,
      include: [
        {
          model: Stadium,
          as: "stadium",
          include: ["location"],
        },
        { model: FieldImage, as: "images" },
      ],
    });

    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fields/search", async (req, res) => {
  try {
    const { keyword, type, minPrice, maxPrice, minRating, sortBy, userLat, userLng } = req.query;

    const fieldConditions = { status: "active" };

    if (type) {
      const typeVariants = getFieldTypeVariants(type);
      if (typeVariants.length > 0) {
        fieldConditions.type = { [Op.in]: typeVariants };
      }
    }

    if (minPrice || maxPrice) {
      fieldConditions.price_per_hour = {};
      if (minPrice) fieldConditions.price_per_hour[Op.gte] = minPrice;
      if (maxPrice) fieldConditions.price_per_hour[Op.lte] = maxPrice;
    }

    if (keyword) {
      fieldConditions[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { "$stadium.name$": { [Op.like]: `%${keyword}%` } },
        { "$stadium.location.district$": { [Op.like]: `%${keyword}%` } },
        { "$stadium.location.city$": { [Op.like]: `%${keyword}%` } },
      ];
    }

    if (minRating) {
      fieldConditions.ratingCondition = Sequelize.where(
        Sequelize.literal(`(
          SELECT COALESCE(AVG(rating), 0)
          FROM reviews
          WHERE reviews.field_id = Field.id
        )`),
        ">=",
        parseFloat(minRating)
      );
    }

    const attributesInclude = [
      [
        Sequelize.literal(`(
          SELECT COALESCE(AVG(rating), 0)
          FROM reviews
          WHERE reviews.field_id = Field.id
        )`),
        "averageRating",
      ],
    ];

    if (sortBy === "gan_nhat" && userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        attributesInclude.push([
          Sequelize.literal(`6371 * acos(LEAST(1.0, cos(radians(${lat})) * cos(radians(\`stadium->location\`.\`latitude\`)) * cos(radians(\`stadium->location\`.\`longitude\`) - radians(${lng})) + sin(radians(${lat})) * sin(radians(\`stadium->location\`.\`latitude\`))))`),
          "distance",
        ]);
      }
    }

    let order = [["createdAt", "DESC"]];
    if (sortBy === "gia_tang") {
      order = [["price_per_hour", "ASC"]];
    } else if (sortBy === "gia_giam") {
      order = [["price_per_hour", "DESC"]];
    } else if (sortBy === "danh_gia") {
      order = [[Sequelize.literal("averageRating"), "DESC"]];
    } else if (
      sortBy === "gan_nhat" &&
      userLat &&
      userLng &&
      !Number.isNaN(parseFloat(userLat)) &&
      !Number.isNaN(parseFloat(userLng))
    ) {
      order = [[Sequelize.literal("distance"), "ASC"]];
    }

    const fields = await Field.findAll({
      where: fieldConditions,
      attributes: { include: attributesInclude },
      include: [
        { model: FieldImage, as: "images" },
        {
          model: Stadium,
          as: "stadium",
          include: [{ model: Location, as: "location" }],
        },
        ...(Review ? [{ model: Review, as: "reviews" }] : []),
      ],
      order,
    });

    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fields/:id", async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id, {
      include: [
        {
          model: Stadium,
          as: "stadium",
          include: [{ model: Location, as: "location" }],
        },
        { model: FieldImage, as: "images" },
        ...(Schedule ? [{ model: Schedule, as: "schedules" }] : []),
        ...(Review
          ? [
              {
                model: Review,
                as: "reviews",
                include: [{ model: User, as: "user", attributes: ["name"] }],
              },
            ]
          : []),
        {
          model: Booking,
          as: "bookings",
          where: { status: { [Op.ne]: "cancelled" } },
          required: false,
        },
      ],
    });

    if (!field) return res.status(404).json({ error: "Không tìm thấy sân" });
    res.json(field);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/fields", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { name, type, price_per_hour, stadium_id, status } = req.body;
    const normalizedType = normalizeFieldType(type);
    const finalStadiumId = stadium_id || 1;
    const allowed = await ensureStadiumAccess(req, finalStadiumId);

    if (!allowed) {
      return res.status(403).json({ error: "Bạn không có quyền thêm sân vào khu này" });
    }

    if (!isValidFieldType(normalizedType)) {
      return res.status(400).json({ error: "Loại sân không hợp lệ" });
    }

    const field = await Field.create({
      name,
      type: normalizedType,
      price_per_hour,
      stadium_id: finalStadiumId,
      status: status || "pending",
    });

    if (req.file) {
      await FieldImage.create({
        field_id: field.id,
        image_url: req.file.filename,
      });
    }

    const fullField = await Field.findByPk(field.id, {
      include: [{ model: FieldImage, as: "images" }],
    });

    await logAdminActivity({
      adminId: req.user?.id,
      action: "OWNER_CREATE_FIELD",
      targetType: "field",
      targetId: field.id,
      afterData: toPlain(fullField),
      ...getRequestMeta(req),
    });

    res.status(201).json({
      message: "Tạo sân thành công",
      field: fullField,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/fields/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { name, type, price_per_hour, stadium_id, status } = req.body;
    const normalizedType = normalizeFieldType(type);
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({ error: "Không tìm thấy sân" });
    }

    const allowed = await ensureFieldAccess(req, field);
    if (!allowed) {
      return res.status(403).json({ error: "Bạn không có quyền sửa sân này" });
    }

    if (!isValidFieldType(normalizedType)) {
      return res.status(400).json({ error: "Loại sân không hợp lệ" });
    }

    const before = toPlain(field);

    await field.update({
      name,
      type: normalizedType,
      price_per_hour,
      stadium_id,
      status,
    });

    if (req.file) {
      const oldImage = await FieldImage.findOne({ where: { field_id: field.id } });
      if (oldImage) {
        await oldImage.update({ image_url: req.file.filename });
      } else {
        await FieldImage.create({
          field_id: field.id,
          image_url: req.file.filename,
        });
      }
    }

    const updatedField = await Field.findByPk(field.id, {
      include: [{ model: FieldImage, as: "images" }],
    });

    await logAdminActivity({
      adminId: req.user?.id,
      action: "OWNER_UPDATE_FIELD",
      targetType: "field",
      targetId: field.id,
      beforeData: before,
      afterData: toPlain(updatedField),
      ...getRequestMeta(req),
    });

    res.json({
      message: "Cập nhật thành công",
      field: updatedField,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/fields/:id", verifyToken, async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: "Không tìm thấy sân" });

    const allowed = await ensureFieldAccess(req, field);
    if (!allowed) {
      return res.status(403).json({ error: "Bạn không có quyền xóa sân này" });
    }

    const bookingCount = await Booking.count({
      where: { field_id: field.id },
    });
    const deletionGuard = getFieldDeletionGuard({ bookingCount });

    if (!deletionGuard.canDelete) {
      return res.status(deletionGuard.statusCode).json({ error: deletionGuard.error });
    }

    const before = toPlain(field);

    await FieldImage.destroy({ where: { field_id: field.id } });
    await Schedule.destroy({ where: { field_id: field.id } });
    await Favorite.destroy({ where: { field_id: field.id } });
    await Review.destroy({ where: { field_id: field.id } });
    await field.destroy();

    await logAdminActivity({
      adminId: req.user?.id,
      action: "OWNER_DELETE_FIELD",
      targetType: "field",
      targetId: before.id,
      beforeData: before,
      ...getRequestMeta(req),
    });

    res.json({ message: "Xóa sân thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/upload-only", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { field_id } = req.body;
    const field = await Field.findByPk(field_id);

    if (!field) return res.status(404).json({ error: "Không tìm thấy sân" });

    const allowed = await ensureFieldAccess(req, field);
    if (!allowed) {
      return res.status(403).json({ error: "Bạn không có quyền upload ảnh cho sân này" });
    }

    const image = await FieldImage.create({
      field_id,
      image_url: req.file.filename,
    });

    res.json({ message: "Upload thành công", image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/owner/fields", verifyToken, async (req, res) => {
  try {
    const fields = await Field.findAll({
      where: {
        status: { [Op.in]: ["pending", "active", "rejected"] },
      },
      include: [
        { model: FieldImage, as: "images" },
        {
          model: Stadium,
          as: "stadium",
          where: { owner_id: req.user.id },
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/admin/fields", verifyToken, checkRole([3, "admin", "ADMIN"]), async (req, res) => {
  try {
    const fields = await Field.findAll({
      include: [
        {
          model: Stadium,
          as: "stadium",
          include: ["location", "owner"],
        },
        { model: FieldImage, as: "images" },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/fields/:id/status", verifyToken, checkRole([3, "admin", "ADMIN"]), async (req, res) => {
  try {
    const { status } = req.body;
    const field = await Field.findByPk(req.params.id);

    if (!field) return res.status(404).json({ error: "Không tìm thấy sân" });

    const before = toPlain(field);
    await field.update({ status });

    await logAdminActivity({
      adminId: req.user?.id,
      action: "ADMIN_UPDATE_FIELD_STATUS",
      targetType: "field",
      targetId: field.id,
      beforeData: { status: before.status },
      afterData: { status: field.status },
      ...getRequestMeta(req),
    });

    res.json({ message: "Đã cập nhật trạng thái sân thành công", field });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

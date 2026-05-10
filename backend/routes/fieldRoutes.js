const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  Field,
  Stadium,
  Location,
  FieldImage,
  Schedule,
  Review,
  Booking,
  User,
} = require("../models");

// GET ALL FIELDS
router.get("/fields", async (req, res) => {
  try {
    const { type } = req.query;

    let condition = { status: "active" };
    if (type && type !== "Tất cả" && type !== "Trang chủ") {
      const { Op } = require("sequelize");
      condition.type = { [Op.like]: `%${type}%` };
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

// BỘ LỌC TÌM KIẾM
router.get("/fields/search", async (req, res) => {
  try {
    const { keyword, type, minPrice, maxPrice, minRating, sortBy, userLat, userLng } = req.query;
    const { Op, Sequelize } = require("sequelize");

    let fieldConditions = { status: "active" };

    if (type) {
      fieldConditions.type = { [Op.like]: `%${type}%` };
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
        parseFloat(minRating),
      );
    }

    let attributesInclude = [
      [
        Sequelize.literal(`(
          SELECT COALESCE(AVG(rating), 0)
          FROM reviews
          WHERE reviews.field_id = Field.id
        )`),
        "averageRating",
      ],
    ];

    if (sortBy === 'gan_nhat' && userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        attributesInclude.push([
          Sequelize.literal(`6371 * acos(LEAST(1.0, cos(radians(${lat})) * cos(radians(\`stadium->location\`.\`latitude\`)) * cos(radians(\`stadium->location\`.\`longitude\`) - radians(${lng})) + sin(radians(${lat})) * sin(radians(\`stadium->location\`.\`latitude\`))))`),
          "distance"
        ]);
      }
    }

    let order = [["createdAt", "DESC"]];
    if (sortBy === 'gia_tang') {
      order = [['price_per_hour', 'ASC']];
    } else if (sortBy === 'gia_giam') {
      order = [['price_per_hour', 'DESC']];
    } else if (sortBy === 'danh_gia') {
      order = [[Sequelize.literal('averageRating'), 'DESC']];
    } else if (sortBy === 'gan_nhat' && userLat && userLng && !isNaN(parseFloat(userLat)) && !isNaN(parseFloat(userLng))) {
      order = [[Sequelize.literal('distance'), 'ASC']];
    }

    const fields = await Field.findAll({
      where: fieldConditions,
      attributes: {
        include: attributesInclude,
      },
      include: [
        { model: FieldImage, as: "images" },
        {
          model: Stadium,
          as: "stadium",
          include: [{ model: Location, as: "location" }],
        },
        ...(Review ? [{ model: Review, as: "reviews" }] : []),
      ],
      order: order,
    });

    if (sortBy === 'gan_nhat') {
      console.log('--- DEBUG: KẾT QUẢ TÍNH KHOẢNG CÁCH (HAVERSINE) ---');
      fields.slice(0, 5).forEach((f, index) => {
        console.log(`[Top ${index + 1}] Sân: ${f.name} | Quận: ${f.stadium?.location?.district} | Tọa độ sân: ${f.stadium?.location?.latitude}, ${f.stadium?.location?.longitude} | Distance: ${f.dataValues.distance} km`);
      });
      console.log('---------------------------------------------------');
    }

    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET FIELD BY ID
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
        ...(Review ? [{ 
          model: Review, 
          as: "reviews",
          include: [{ model: User, as: "user", attributes: ['name'] }]
        }] : []),
        {
          model: Booking,
          as: "bookings",
          where: { status: { [require("sequelize").Op.ne]: "cancelled" } },
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

// TẠO SÂN MỚI
router.post("/fields", upload.single("image"), async (req, res) => {
  try {
    const { name, type, price_per_hour, stadium_id, status } = req.body;

    const field = await Field.create({
      name,
      type,
      price_per_hour,
      stadium_id: stadium_id || 1,
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

    res.status(201).json({
      message: "Tạo sân thành công",
      field: fullField,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CẬP NHẬT SÂN
router.put("/fields/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, type, price_per_hour, stadium_id, status } = req.body;

    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({ error: "Không tìm thấy sân" });
    }

    await field.update({
      name,
      type,
      price_per_hour,
      stadium_id,
      status,
    });

    // Nếu có ảnh mới => cập nhật ảnh cũ
    if (req.file) {
      const oldImage = await FieldImage.findOne({
        where: { field_id: field.id },
      });

      if (oldImage) {
        await oldImage.update({
          image_url: req.file.filename,
        });
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

    res.json({
      message: "Cập nhật thành công",
      field: updatedField,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// XÓA SÂN
router.delete("/fields/:id", async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);
    if (!field) return res.status(404).json({ error: "Không tìm thấy sân" });

    await field.destroy();
    res.json({ message: "Xoá sân thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD ẢNH RIÊNG LẺ
router.post("/upload-only", upload.single("image"), async (req, res) => {
  try {
    const { field_id } = req.body;
    const image = await FieldImage.create({
      field_id: field_id,
      image_url: req.file.filename,
    });
    res.json({ message: "Upload thành công", image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LẤY DANH SÁCH SÂN CHO OWNER
router.get("/owner/fields", verifyToken, async (req, res) => {
  try {
    const { Op } = require("sequelize");
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

// ADMIN: QUẢN LÝ TẤT CẢ SÂN
router.get("/admin/fields", async (req, res) => {
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

// ADMIN: CẬP NHẬT TRẠNG THÁI SÂN LẺ
router.patch("/fields/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const field = await Field.findByPk(req.params.id);

    if (!field) return res.status(404).json({ error: "Không tìm thấy sân" });

    await field.update({ status });
    res.json({ message: "Đã cập nhật trạng thái sân thành công", field });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

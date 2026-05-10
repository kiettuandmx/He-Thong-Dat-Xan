const express = require("express");
const router = express.Router();

const { Favorite, Field, FieldImage } = require("../models");
const { verifyToken } = require("../middleware/authMiddleware");

// ✅ Thêm yêu thích
router.post("/:fieldId", verifyToken, async (req, res) => {
  try {
    const fieldId = req.params.fieldId;

    const exist = await Favorite.findOne({
      where: {
        user_id: req.user.id,
        field_id: fieldId,
      },
    });

    if (exist) {
      return res.status(400).json({
        message: "Đã lưu sân này",
      });
    }

    await Favorite.create({
      user_id: req.user.id,
      field_id: fieldId,
    });

    res.json({
      message: "Đã thêm yêu thích",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ Xoá yêu thích
router.delete("/:fieldId", verifyToken, async (req, res) => {
  try {
    await Favorite.destroy({
      where: {
        user_id: req.user.id,
        field_id: req.params.fieldId,
      },
    });

    res.json({
      message: "Đã xoá yêu thích",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ✅ Lấy danh sách yêu thích
router.get("/", verifyToken, async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          model: Field,
          as: "field",
          include: [
            {
              model: FieldImage,
              as: "images",
            },
          ],
        },
      ],
    });

    res.json(favorites);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;

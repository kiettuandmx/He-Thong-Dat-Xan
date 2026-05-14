const db = require('../models');

// 1. Lấy tất cả Hashtag
exports.getAll = async (req, res) => {
  try {
    const hashtags = await db.Hashtag.findAll({
      order: [['name', 'ASC']]
    });
    res.json(hashtags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Admin tạo Hashtag mới
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên hashtag không được để trống' });

    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const hashtag = await db.Hashtag.create({ name, slug });
    res.status(201).json(hashtag);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Hashtag này đã tồn tại' });
    }
    res.status(500).json({ message: err.message });
  }
};

// 3. Admin cập nhật Hashtag
exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    await db.Hashtag.update({ name, slug }, { where: { id } });
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Admin xóa Hashtag
exports.remove = async (req, res) => {
  try {
    await db.Hashtag.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Đã xóa hashtag' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Gán Hashtag cho Sân (Stadium)
exports.setStadiumHashtags = async (req, res) => {
  try {
    const { hashtag_ids } = req.body; // Mảng các ID hashtag
    const stadium = await db.Stadium.findByPk(req.params.id);

    if (!stadium) return res.status(404).json({ message: 'Không tìm thấy sân' });

    // Sử dụng magic method setHashtags (số nhiều của Hashtag)
    await stadium.setHashtags(hashtag_ids);

    res.json({ success: true, message: 'Đã cập nhật hashtag cho sân' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

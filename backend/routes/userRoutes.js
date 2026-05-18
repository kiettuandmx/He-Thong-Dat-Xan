const express = require('express');
const { User, Role } = require('../models');
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/users', verifyToken, checkRole([3]), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password'] },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/role', verifyToken, checkRole([3]), async (req, res) => {
  try {
    const { role_id } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    await user.update({ role_id });
    res.json({ message: 'Cập nhật quyền hạn thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', verifyToken, checkRole([3]), async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa người dùng khỏi hệ thống' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile/:id', verifyToken, userController.updateProfile);

module.exports = router;

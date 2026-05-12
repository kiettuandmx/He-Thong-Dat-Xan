// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { User, Role, Stadium } = require('../models');

// 1. Lấy toàn bộ danh sách User kèm theo Role của họ
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{ model: Role, as: 'role' }],
            attributes: { exclude: ['password'] } // Không gửi mật khẩu về frontend
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Cập nhật Role cho User (Ví dụ: Biến User thành Owner)
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { role_id } = req.body;
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });
        
        await user.update({ role_id });
        res.json({ message: "Cập nhật quyền hạn thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Xóa tài khoản (Ban user)
router.delete('/users/:id', async (req, res) => {
    try {
        await User.destroy({ where: { id: req.params.id } });
        res.json({ message: "Đã xóa người dùng khỏi hệ thống" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 4. Cập nhật profile người dùng
const userController = require('../controllers/userController');
router.put('/profile/:id', userController.updateProfile);

module.exports = router;
const { User } = require('../models');

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        // Cập nhật thông tin (Chỉ cho phép cập nhật tên và sđt, không cập nhật email/role/password ở đây)
        user.name = full_name || user.name;
        user.phone = phone || user.phone;
        await user.save();

        res.json({ success: true, message: "Cập nhật thành công", user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role_id
        }});
    } catch (error) {
        console.error("Lỗi cập nhật profile:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

module.exports = {
    updateProfile
};

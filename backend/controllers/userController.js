const { User } = require('../models');

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, bank_name, bank_account } = req.body;
        const { id } = req.params;
        const isAdmin = Number(req.user?.role) === 3;

        if (!isAdmin && Number(req.user?.id) !== Number(id)) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật hồ sơ này" });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        // Cập nhật thông tin (Chỉ cho phép cập nhật tên và sđt, không cập nhật email/role/password ở đây)
        user.name = full_name || user.name;
        user.phone = phone || user.phone;
        user.bank_name = bank_name !== undefined ? String(bank_name || '').trim() : user.bank_name;
        user.bank_account =
            bank_account !== undefined ? String(bank_account || '').trim() : user.bank_account;
        await user.save();

        res.json({ success: true, message: "Cập nhật thành công", user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            bank_name: user.bank_name,
            bank_account: user.bank_account,
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

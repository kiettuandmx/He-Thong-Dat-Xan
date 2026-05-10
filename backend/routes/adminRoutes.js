const express = require("express");
const router = express.Router();
const { User, Role, Stadium, Location, Field } = require("../models");
const socketManager = require("../socket");

// 1. QUẢN LÝ USER: Lấy danh sách tất cả người dùng
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, as: "role" }],
      attributes: { exclude: ["password"] }, // Bảo mật: không gửi password
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. QUẢN LÝ USER: Cập nhật quyền (Role) cho User
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role_id } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

    await user.update({ role_id });
    res.json({ message: "Đã cập nhật quyền hạn" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. QUẢN LÝ STADIUM: Lấy tất cả Stadium để duyệt
router.get("/stadiums", async (req, res) => {
  try {
    const stadiums = await Stadium.findAll({
      include: [
        { model: User, as: "owner", attributes: ["name", "email"] },
        { model: Location, as: "location" },
      ],
    });
    res.json(stadiums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. QUẢN LÝ STADIUM: Duyệt hoặc Khóa Stadium
router.patch("/stadiums/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // 'active', 'rejected', 'hidden'
    const stadium = await Stadium.findByPk(req.params.id);
    if (!stadium)
      return res.status(404).json({ error: "Không tìm thấy Stadium" });

    await stadium.update({ status });
    res.json({ message: `Trạng thái đã chuyển sang: ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. THỐNG KÊ NHANH (Dashboard)
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStadiums = await Stadium.count();
    const totalFields = await Field.count();
    // Đếm số sân con đang ở trạng thái pending (vì đã chuyển sang duyệt theo Field)
    const pendingFields = await Field.count({ where: { status: "pending" } });

    res.json({
      totalUsers,
      totalStadiums,
      totalFields,
      pendingFields,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. API GỬI THÔNG BÁO TOÀN BỘ NGƯỜI DÙNG
router.post("/send-global-notification", async (req, res) => {
  try {
    const { title, content, type } = req.body;

    // A. LƯU VÀO DATABASE (Để User mở chuông ra là thấy)
    // Lưu ý: Đảm bảo bạn đã import Model Notification ở đầu file
    const { Notification } = require("../models");

    const newNoti = await Notification.create({
      title,
      content,
      type,
      user_id: null,
      is_read: false,
      createdAt: new Date(),
    });

    // B. PHÁT SOCKET (Để những người đang online nhận được popup ngay)
    const io = socketManager.getIO();
    io.emit("new_notification", newNoti); // Gửi nguyên object vừa tạo trong DB

    res.json({ success: true, data: newNoti });
  } catch (err) {
    console.error("Lỗi khi gửi thông báo:", err);
    res.status(500).json({ error: "Lỗi server không thể lưu thông báo" });
  }
});

module.exports = router;

const express = require("express");
const { Op } = require("sequelize");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const { User, Role, Stadium, Location, Field, Notification, AdminActivityLog, Booking } = require("../models");
const { logAdminActivity } = require("../utils/adminActivityLogger");
const complaintController = require("../controllers/complaintController");
const { createNotificationsForUsers } = require("../utils/notificationHelper");

const router = express.Router();

router.use(verifyToken, checkRole([3, "admin", "ADMIN"]));

const getRequestMeta = (req) => ({
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

const toPlain = (instance) => (instance ? instance.get({ plain: true }) : null);

// 1. QUAN LY USER: Lay danh sach tat ca nguoi dung
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, as: "role" }],
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. QUAN LY USER: Cap nhat quyen (Role) cho User
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role_id } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "Không tìm thấy user" });

    const before = toPlain(user);
    await user.update({ role_id });

    await logAdminActivity({
      adminId: req.user?.id,
      action: "USER_ROLE_UPDATE",
      targetType: "user",
      targetId: user.id,
      beforeData: { role_id: before.role_id },
      afterData: { role_id: user.role_id },
      ...getRequestMeta(req),
    });

    res.json({ message: "Da cap nhat quyen han" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. QUAN LY STADIUM: Lay tat ca Stadium de duyet
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

// 4. QUAN LY STADIUM: Duyet hoac Khoa Stadium
router.patch("/stadiums/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const stadium = await Stadium.findByPk(req.params.id);
    if (!stadium)
      return res.status(404).json({ error: "Không tìm thấy Stadium" });

    const before = toPlain(stadium);
    await stadium.update({ status });

    await logAdminActivity({
      adminId: req.user?.id,
      action: "STADIUM_STATUS_UPDATE",
      targetType: "stadium",
      targetId: stadium.id,
      beforeData: { status: before.status },
      afterData: { status: stadium.status },
      ...getRequestMeta(req),
    });

    res.json({ message: `Trang thai da chuyen sang: ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. THONG KE NHANH (Dashboard)
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStadiums = await Stadium.count();
    const totalFields = await Field.count();
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

// 5.1 QUAN LY DON DAT SAN TOAN HE THONG
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        {
          model: Field,
          as: "field",
          attributes: ["id", "name", "type", "price_per_hour"],
          include: [
            {
              model: Stadium,
              as: "stadium",
              attributes: ["id", "name", "owner_id"],
              include: [{ model: User, as: "owner", attributes: ["id", "name", "email", "phone"] }],
            },
          ],
        },
        {
          model: Stadium,
          as: "stadium",
          attributes: ["id", "name", "owner_id"],
          include: [{ model: User, as: "owner", attributes: ["id", "name", "email", "phone"] }],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. API GUI THONG BAO TOAN BO NGUOI DUNG
router.post("/send-global-notification", async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const users = await User.findAll({
      attributes: ["id", "role_id"],
    });

    const notifications = await createNotificationsForUsers(
      users.map((user) => ({
        userId: user.id,
        title: title || "Thông báo hệ thống",
        content,
        type: type || "system_announcement",
        targetType: "announcement",
        targetRoute:
          Number(user.role_id) === 3
            ? "/admin/dashboard"
            : Number(user.role_id) === 2
              ? "/owner/dashboard"
              : "/",
      }))
    );

    await logAdminActivity({
      adminId: req.user?.id,
      action: "GLOBAL_NOTIFICATION_CREATE",
      targetType: "notification",
      targetId: notifications[0]?.id,
      afterData: {
        title: title || "Thông báo hệ thống",
        content,
        type: type || "system_announcement",
        recipients: notifications.length,
      },
      ...getRequestMeta(req),
    });

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("Lỗi khi gửi thông báo:", err);
    res.status(500).json({ error: "Lỗi server không thể lưu thông báo" });
  }
});

// 7. QUAN LY KHIEU NAI
router.get("/complaints", complaintController.getAdminComplaints);
router.get("/complaints/:id", complaintController.getAdminComplaintById);
router.get("/complaints/:id/activity-context", complaintController.getComplaintActivityContext);
router.patch("/complaints/:id/status", complaintController.updateComplaintStatus);
router.post("/complaints/:id/resolve", complaintController.resolveComplaint);

// 7. NHAT KY HOAT DONG ADMIN
router.get("/activity-logs", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      admin_id,
      action,
      target_type,
      target_id,
      start_date,
      end_date,
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (parsedPage - 1) * parsedLimit;

    const where = {};

    if (admin_id) where.admin_id = admin_id;
    if (action) where.action = action;
    if (target_type) where.target_type = target_type;
    if (target_id) where.target_id = String(target_id);

    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) where.createdAt[Op.gte] = new Date(start_date);
      if (end_date) where.createdAt[Op.lte] = new Date(end_date);
    }

    const { count, rows } = await AdminActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "admin",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parsedLimit,
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

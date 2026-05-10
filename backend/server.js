require("dotenv").config();

const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { sequelize } = require("./models");
const { verifyToken } = require("./middleware/authMiddleware");
const http = require("http");
const server = http.createServer(app);
const socket = require("./socket");

// Khởi tạo Socket
socket.init(server);

// --- MIDDLEWARES ---
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

// --- ROUTES ---
const fieldRoutes = require("./routes/fieldRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const stadiumRoutes = require("./routes/stadiumRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const couponRoutes = require("./routes/couponRoutes");

app.use("/api", fieldRoutes);
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/coupons", couponRoutes);

// --- MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage: storage });

const { Field, FieldImage } = require("./models");

app.post("/api/fields", upload.single("image"), async (req, res) => {
  try {
    const { field_name, type, price } = req.body;
    const imagePath = req.file ? req.file.filename : null;
    const newField = await Field.create({
      name: field_name,
      type: type,
      price_per_hour: price,
      stadium_id: 1,
      status: "available",
    });
    if (imagePath && newField.id) {
      await FieldImage.create({ field_id: newField.id, image_url: imagePath });
    }
    res.status(201).json({ message: "Thêm sân và ảnh thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
});

app.get("/api/me", verifyToken, (req, res) => {
  res.json(req.user);
});

// --- START SERVER (Đúng chuẩn Socket.io) ---
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Kết nối DB thành công");
    // QUAN TRỌNG: Dùng server.listen thay vì app.listen
    server.listen(PORT, () => {
      console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
      
      // Auto-release expired reservations every minute
      const { Op } = require('sequelize');
      const { Booking } = require('./models');
      const socketObj = require('./socket');
      
      setInterval(async () => {
        try {
          const expiredBookings = await Booking.findAll({
            where: {
              status: 'pending',
              payment_status: 'unpaid',
              hold_until: { [Op.lt]: new Date() }
            }
          });
          
          for (let booking of expiredBookings) {
            await booking.update({ status: 'expired' });
            // Broadcast release event
            try {
              const io = socketObj.getIO();
              io.emit('slotReleased', { 
                field_id: booking.field_id, 
                date: booking.booking_date, 
                start_time: booking.start_time 
              });
            } catch (e) {
              console.log("Socket emit error on auto-release:", e.message);
            }
          }
          if (expiredBookings.length > 0) {
            console.log(`🧹 Auto-released ${expiredBookings.length} expired reservations.`);
          }
        } catch (err) {
          console.error("Lỗi auto-release:", err);
        }
      }, 60000); // 1 minute
    });
  })
  .catch((err) => console.error("❌ Lỗi DB:", err));

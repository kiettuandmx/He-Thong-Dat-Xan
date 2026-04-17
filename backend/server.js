const express = require("express");
const app = express();
const cors = require("cors");

const { sequelize } = require("./models");
const fieldRoutes = require("./routes/fieldRoutes");
// 2. Sử dụng Middleware CORS
app.use(cors());

app.use(express.json());

// 3. Khai báo các Routes sau khi đã use(cors)
app.use("/api", fieldRoutes);

sequelize
  .authenticate()
  .then(() => console.log("✅ Kết nối DB thành công"))
  .catch((err) => console.error("❌ Lỗi DB:", err));


// server asdasdadadadasdadasdsad

// chạy server
app.listen(PORT, () => {
  console.log(`Server Backend đang chạy tại: http://localhost:${PORT}`);
app.listen(5000, () => {
  console.log("🚀 Server chạy tại http://localhost:5000");
});

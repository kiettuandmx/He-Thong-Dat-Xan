const express = require("express");
const app = express();
const cors = require("cors");
const { User, Stadium } = require("./models");

app.use(cors());
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.send("Hello World");
});
const PORT = 5000;
// API kiểm tra DB
app.get("/api/test-db", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["name", "email", "phone"],
    });

    res.json({
      status: "Success",
      message: "Kết nối Database thành công! Chào Kiet, Lam, Anh.",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: "Lỗi kết nối DB: " + error.message,
    });
  }
});

// chạy server
app.listen(PORT, () => {
  console.log(`Server Backend đang chạy tại: http://localhost:${PORT}`);
});

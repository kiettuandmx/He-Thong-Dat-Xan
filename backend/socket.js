// backend/socket.js
let io;
const userSockets = {};

module.exports = {
  init: (httpServer) => {
    const { Server } = require("socket.io");
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      // Đăng ký user khi login
      socket.on("login", (userId) => {
        userSockets[userId] = socket.id;
        console.log(`✅ User ${userId} kết nối với socket ${socket.id}`);
      });

      // Dọn dẹp khi user disconnect (đóng tab, refresh trang)
      socket.on("disconnect", () => {
        for (const [userId, socketId] of Object.entries(userSockets)) {
          if (socketId === socket.id) {
            delete userSockets[userId];
            console.log(`❌ User ${userId} ngắt kết nối, xóa socket ${socket.id}`);
            break;
          }
        }
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error("Socket.io chưa được khởi tạo!");
    return io;
  },
  userSockets: userSockets,
};

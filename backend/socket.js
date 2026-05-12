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
      socket.on("login", (userId) => {
        userSockets[userId] = socket.id;
        console.log(`✅ User ${userId} kết nối với socket ${socket.id}`);
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

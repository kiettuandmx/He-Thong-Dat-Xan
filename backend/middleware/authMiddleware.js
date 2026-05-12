const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Debug: Xem toàn bộ Header gửi lên
    console.log(">>> Header nhận được tại Server:", req.headers.authorization);

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "Không tìm thấy token!" });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
        if (err) return res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn!" });
        req.user = decoded;
        next();
    });
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
    }
    next();
  };
};

// Xuất cả 2 hàm dưới dạng một object
module.exports = { verifyToken, checkRole };
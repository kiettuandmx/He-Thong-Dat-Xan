const jwt = require('jsonwebtoken');

const normalizeRole = (role) => {
  if (role === 'admin' || role === 'ADMIN') return 3;
  if (role === 'owner' || role === 'OWNER') return 2;
  if (role === 'user' || role === 'USER') return 1;
  const parsed = Number(role);
  return Number.isNaN(parsed) ? role : parsed;
};

const isAdminRole = (role) => normalizeRole(role) === 3;

const verifyToken = (req, res, next) => {
  console.log('>>> Header nhan duoc tai Server:', req.headers.authorization);

  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Không tìm thấy token!' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn!' });
    }

    decoded.role = normalizeRole(decoded.role);
    req.user = decoded;
    next();
  });
};

const checkRole = (roles = []) => {
  const normalizedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    const currentRole = normalizeRole(req.user?.role);

    if (isAdminRole(currentRole)) {
      return next();
    }

    if (!normalizedRoles.includes(currentRole)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập!' });
    }

    next();
  };
};

module.exports = { verifyToken, checkRole, normalizeRole, isAdminRole };

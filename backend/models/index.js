'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // THÊM ĐOẠN NÀY: Ép Sequelize sử dụng cấu hình từ file json
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config, // Giải nén các thuộc tính từ config.json (host, dialect, logging,...)
    dialectOptions: {
      charset: 'utf8mb4', // Ép kết nối dùng utf8mb4
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  });
}
// 1. Tự động load tất cả các file model
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// 2. Chạy các hàm associate trong từng file model lẻ (Đây là nơi Booking.js lấy quan hệ của nó)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// CHỈ GIỮ LẠI NHỮNG QUAN HỆ MÀ TRONG FILE LẺ CHƯA CÓ
// Nếu Stadium.js chưa có hasMany Booking thì viết ở đây:
if (db.Stadium && db.Booking) {
    // Để Owner có thể lấy đơn hàng, Stadium cần hasMany Booking
    db.Stadium.hasMany(db.Booking, { foreignKey: 'stadium_id', as: 'bookings' });
}

// Đã xóa quan hệ Field - FieldImage ở đây vì đã được khai báo trong models/field.js

// XÓA BỎ các dòng db.Booking.belongsTo(...) thủ công ở đây 
// vì mình đã viết nó bên trong file Booking.js rồi.
// 1. Một đơn đặt sân có một đánh giá
db.Booking.hasOne(db.Review, { foreignKey: 'booking_id', as: 'review' });

// 2. Một đánh giá thuộc về một đơn đặt sân (Đây là cái Lâm đang thiếu)
db.Review.belongsTo(db.Booking, { foreignKey: 'booking_id', as: 'booking' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Chỉ tự đồng bộ schema khi không chạy test để tránh race condition lúc đóng kết nối.
if (env !== 'test' && process.env.SKIP_AUTO_SYNC !== 'true') {
  db.sequelize.sync({ alter: true })
    .then(() => {
      console.log('✅ Laragon: Database đã được đồng bộ và cập nhật cột mới!');
    })
    .catch(err => {
      console.error('❌ Laragon: Lỗi đồng bộ Database:', err);
    });
}
  
module.exports = db;

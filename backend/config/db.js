/**
 * ========================================
 * DATABASE CONNECTION CONFIGURATION
 * File: config/db.js
 * ========================================
 * Cấu hình kết nối database MySQL sử dụng Sequelize ORM
 * Tất cả thông tin kết nối đều được đọc từ biến môi trường (process.env)
 * để đảm bảo bảo mật và không để lộ thông tin nhạy cảm
 */

const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load biến environment từ file .env

/**
 * Kiểm tra các biến environment bắt buộc
 */
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingVars.length > 0) {
  throw new Error(
    `❌ Missing required environment variables: ${missingVars.join(', ')}\n` +
    `Please check your .env file and make sure all variables are defined.`
  );
}

/**
 * Tạo instance Sequelize kết nối tới MySQL
 * ========================================
 * - Database: process.env.DB_NAME
 * - User: process.env.DB_USER
 * - Password: process.env.DB_PASS
 * - Host: process.env.DB_HOST
 * - Port: process.env.DB_PORT (mặc định 3306 của MySQL)
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Database name
  process.env.DB_USER,     // Username
  process.env.DB_PASS,     // Password
  {
    host: process.env.DB_HOST,           // Host (localhost, IP, v.v...)
    port: process.env.DB_PORT || 3306,   // Port (mặc định 3306)
    dialect: 'mysql',                     // Loại database
    logging: process.env.DB_LOGGING === 'true' ? console.log : false, // Log SQL queries nếu cần
    pool: {
      max: 5,           // Số connection tối đa
      min: 0,           // Số connection tối thiểu
      acquire: 30000,   // Thời gian chờ acquire connection (ms)
      idle: 10000       // Thời gian connection idle trước khi close (ms)
    },
    define: {
      timestamps: true, // Tự động thêm createdAt, updatedAt
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

/**
 * Test kết nối database
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      '✓ Database connection successful! ' +
      `(${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME})`
    );
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }
};

/**
 * Export
 */
module.exports = sequelize;

// Gọi test khi file được require (optional)
if (require.main === module) {
  testConnection();
}

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS !== undefined ? process.env.DB_PASS : "123456",
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false // Để terminal đỡ rối
  }
);

module.exports = sequelize; // Chỉ export duy nhất cái này thôi
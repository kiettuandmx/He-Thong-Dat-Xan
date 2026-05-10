'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.Stadium, { foreignKey: 'stadium_id', as: 'stadium' });
      Booking.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
      Booking.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  Booking.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: DataTypes.INTEGER,
    field_id: DataTypes.INTEGER,
    stadium_id: DataTypes.INTEGER,
    booking_date: DataTypes.DATEONLY,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    total_price: DataTypes.DECIMAL(10, 0),

    // Các trường thanh toán mới
    amount_paid: {
      type: DataTypes.DECIMAL(10, 0),
      defaultValue: 0
    },
    payment_type: {
      type: DataTypes.ENUM('full', 'deposit'),
      defaultValue: 'full'
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'partially_paid', 'paid'),
      defaultValue: 'unpaid'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      defaultValue: 'cash'
    },

    status: {
      type: DataTypes.STRING(255),
      defaultValue: 'pending'
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    hold_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    coupon_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    // createdAt và updatedAt ĐÃ ĐƯỢC LƯỢC BỎ VÌ SEQUELIZE TỰ QUẢN LÝ
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: true, // Đảm bảo cái này là true để tự động có createdAt/updatedAt
  });

  return Booking;
};
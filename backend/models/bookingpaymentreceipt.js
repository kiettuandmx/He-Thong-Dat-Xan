'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingPaymentReceipt extends Model {
    static associate(models) {
      BookingPaymentReceipt.belongsTo(models.Booking, {
        foreignKey: 'booking_id',
        as: 'booking',
      });
      BookingPaymentReceipt.belongsTo(models.FoodOrder, {
        foreignKey: 'food_order_id',
        as: 'foodOrder',
      });
    }
  }

  BookingPaymentReceipt.init(
    {
      booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      food_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      provider: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'sepay',
      },
      provider_transaction_id: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      payment_reference: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      transfer_amount: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: false,
      },
      transfer_content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      matched_status: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      matched_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      raw_payload: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      received_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'BookingPaymentReceipt',
      tableName: 'booking_payment_receipts',
      timestamps: true,
    }
  );

  return BookingPaymentReceipt;
};

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecurringBookingItem extends Model {
    static associate(models) {
      RecurringBookingItem.belongsTo(models.RecurringBookingSeries, {
        foreignKey: 'series_id',
        as: 'series',
      });
      RecurringBookingItem.belongsTo(models.Booking, {
        foreignKey: 'booking_id',
        as: 'booking',
      });
    }
  }

  RecurringBookingItem.init(
    {
      series_id: DataTypes.INTEGER,
      booking_id: DataTypes.INTEGER,
      scheduled_date: DataTypes.DATEONLY,
      start_time: DataTypes.TIME,
      end_time: DataTypes.TIME,
      base_price: DataTypes.DECIMAL(12, 0),
      amount_paid: DataTypes.DECIMAL(12, 0),
      remaining_amount: DataTypes.DECIMAL(12, 0),
      payment_due_date: DataTypes.DATEONLY,
      item_status: DataTypes.STRING,
      was_rescheduled: DataTypes.BOOLEAN,
      original_date_time: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'RecurringBookingItem',
      tableName: 'recurring_booking_items',
      timestamps: true,
    }
  );

  return RecurringBookingItem;
};

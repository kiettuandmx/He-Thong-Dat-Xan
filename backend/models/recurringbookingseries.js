'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecurringBookingSeries extends Model {
    static associate(models) {
      RecurringBookingSeries.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      RecurringBookingSeries.belongsTo(models.Field, {
        foreignKey: 'field_id',
        as: 'field',
      });
      RecurringBookingSeries.belongsTo(models.Stadium, {
        foreignKey: 'stadium_id',
        as: 'stadium',
      });
      RecurringBookingSeries.hasMany(models.RecurringBookingItem, {
        foreignKey: 'series_id',
        as: 'items',
      });
      RecurringBookingSeries.hasMany(models.Booking, {
        foreignKey: 'recurring_series_id',
        as: 'bookings',
      });
    }
  }

  RecurringBookingSeries.init(
    {
      user_id: DataTypes.INTEGER,
      field_id: DataTypes.INTEGER,
      stadium_id: DataTypes.INTEGER,
      recurrence_type: DataTypes.STRING,
      start_date: DataTypes.DATEONLY,
      end_date: DataTypes.DATEONLY,
      occurrence_count: DataTypes.INTEGER,
      preferred_day_of_week: DataTypes.INTEGER,
      preferred_start_time: DataTypes.TIME,
      preferred_end_time: DataTypes.TIME,
      total_estimated_amount: DataTypes.DECIMAL(12, 0),
      deposit_amount: DataTypes.DECIMAL(12, 0),
      deposit_percent: DataTypes.DECIMAL(5, 2),
      approval_status: DataTypes.STRING,
      payment_status_summary: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'RecurringBookingSeries',
      tableName: 'recurring_booking_series',
      timestamps: true,
    }
  );

  return RecurringBookingSeries;
};

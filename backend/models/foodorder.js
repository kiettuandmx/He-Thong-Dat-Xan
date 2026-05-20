'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FoodOrder extends Model {
    static associate(models) {
      FoodOrder.belongsTo(models.Booking, {
        foreignKey: 'booking_id',
        as: 'booking',
      });
      FoodOrder.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      FoodOrder.belongsTo(models.Field, {
        foreignKey: 'field_id',
        as: 'field',
      });
      FoodOrder.hasMany(models.FoodOrderItem, {
        foreignKey: 'food_order_id',
        as: 'items',
      });
    }
  }

  FoodOrder.init(
    {
      booking_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      field_id: DataTypes.INTEGER,
      status: DataTypes.STRING,
      total_amount: DataTypes.DECIMAL(12, 0),
      payment_method: DataTypes.STRING,
      payment_status: DataTypes.STRING,
      ordered_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'FoodOrder',
      tableName: 'food_orders',
      timestamps: true,
    }
  );

  return FoodOrder;
};

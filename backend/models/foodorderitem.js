'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FoodOrderItem extends Model {
    static associate(models) {
      FoodOrderItem.belongsTo(models.FoodOrder, {
        foreignKey: 'food_order_id',
        as: 'foodOrder',
      });
      FoodOrderItem.belongsTo(models.MenuItem, {
        foreignKey: 'menu_item_id',
        as: 'menuItem',
      });
    }
  }

  FoodOrderItem.init(
    {
      food_order_id: DataTypes.INTEGER,
      menu_item_id: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      unit_price: DataTypes.DECIMAL(12, 0),
      line_total: DataTypes.DECIMAL(12, 0),
    },
    {
      sequelize,
      modelName: 'FoodOrderItem',
      tableName: 'food_order_items',
      timestamps: true,
    }
  );

  return FoodOrderItem;
};

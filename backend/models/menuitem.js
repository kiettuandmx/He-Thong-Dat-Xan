'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuItem extends Model {
    static associate(models) {
      MenuItem.belongsTo(models.Field, {
        foreignKey: 'field_id',
        as: 'field',
      });
      MenuItem.hasMany(models.FoodOrderItem, {
        foreignKey: 'menu_item_id',
        as: 'orderItems',
      });
    }
  }

  MenuItem.init(
    {
      field_id: DataTypes.INTEGER,
      name: DataTypes.STRING,
      price: DataTypes.DECIMAL(12, 0),
      image: DataTypes.STRING,
      is_available: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'MenuItem',
      tableName: 'menu_items',
      timestamps: true,
    }
  );

  return MenuItem;
};

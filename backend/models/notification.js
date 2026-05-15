'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  Notification.init({
    user_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    type: DataTypes.STRING,
    target_type: DataTypes.STRING,
    target_id: DataTypes.STRING,
    target_route: DataTypes.STRING,
    is_read: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications'
  });

  return Notification;
};

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminActivityLog extends Model {
    static associate(models) {
      AdminActivityLog.belongsTo(models.User, {
        foreignKey: 'admin_id',
        as: 'admin',
      });
    }
  }

  AdminActivityLog.init(
    {
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      target_type: DataTypes.STRING(100),
      target_id: DataTypes.STRING(100),
      before_data: DataTypes.JSON,
      after_data: DataTypes.JSON,
      ip_address: DataTypes.STRING(45),
      user_agent: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'AdminActivityLog',
      tableName: 'admin_activity_logs',
      timestamps: true,
    }
  );

  return AdminActivityLog;
};


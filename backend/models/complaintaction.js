'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComplaintAction extends Model {
    static associate(models) {
      ComplaintAction.belongsTo(models.Complaint, {
        foreignKey: 'complaint_id',
        as: 'complaint',
      });
      ComplaintAction.belongsTo(models.User, {
        foreignKey: 'admin_id',
        as: 'admin',
      });
    }
  }

  ComplaintAction.init(
    {
      complaint_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      admin_id: DataTypes.INTEGER,
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      note: DataTypes.TEXT,
      before_data: DataTypes.JSON,
      after_data: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: 'ComplaintAction',
      tableName: 'complaint_actions',
      timestamps: true,
    }
  );

  return ComplaintAction;
};


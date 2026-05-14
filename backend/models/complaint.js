'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Complaint extends Model {
    static associate(models) {
      Complaint.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Complaint.belongsTo(models.User, { foreignKey: 'assigned_admin_id', as: 'assignedAdmin' });
      Complaint.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
      Complaint.belongsTo(models.Stadium, { foreignKey: 'stadium_id', as: 'stadium' });
      Complaint.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
      Complaint.hasMany(models.ComplaintAction, { foreignKey: 'complaint_id', as: 'actions' });
    }
  }

  Complaint.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      booking_id: DataTypes.INTEGER,
      stadium_id: DataTypes.INTEGER,
      field_id: DataTypes.INTEGER,
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      evidence_urls: DataTypes.JSON,
      status: {
        type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      assigned_admin_id: DataTypes.INTEGER,
      resolution_type: DataTypes.ENUM('refund_user', 'penalize_owner', 'no_action'),
      resolution_note: DataTypes.TEXT,
      penalty_amount: DataTypes.DECIMAL(10, 2),
      resolved_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Complaint',
      tableName: 'complaints',
      timestamps: true,
    }
  );

  return Complaint;
};


'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WalletTransaction extends Model {
    static associate(models) {
      WalletTransaction.belongsTo(models.Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
      WalletTransaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      WalletTransaction.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    }
  }

  WalletTransaction.init(
    {
      wallet_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      booking_id: DataTypes.INTEGER,
      type: DataTypes.STRING,
      status: DataTypes.STRING,
      amount: DataTypes.DECIMAL(12, 0),
      balance_before: DataTypes.DECIMAL(12, 0),
      balance_after: DataTypes.DECIMAL(12, 0),
      description: DataTypes.STRING,
      reference_type: DataTypes.STRING,
      reference_id: DataTypes.INTEGER,
      metadata: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: 'WalletTransaction',
      tableName: 'wallet_transactions',
      timestamps: true,
    }
  );

  return WalletTransaction;
};

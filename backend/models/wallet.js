'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Wallet.hasMany(models.WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });
    }
  }

  Wallet.init(
    {
      user_id: DataTypes.INTEGER,
      balance: {
        type: DataTypes.DECIMAL(12, 0),
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Wallet',
      tableName: 'wallets',
      timestamps: true,
    }
  );

  return Wallet;
};

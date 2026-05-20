"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Một User thuộc một Role
      User.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });

      // Một User có nhiều Bookings
      User.hasMany(models.Booking, {
        foreignKey: "user_id",
        as: "bookings",
      });

      // Một User có nhiều Yêu thích
      User.hasMany(models.Favorite, {
        foreignKey: "user_id",
        as: "favorites",
      });

      User.hasOne(models.Wallet, {
        foreignKey: "user_id",
        as: "wallet",
      });

      User.hasMany(models.WalletTransaction, {
        foreignKey: "user_id",
        as: "walletTransactions",
      });

      User.hasMany(models.RecurringBookingSeries, {
        foreignKey: "user_id",
        as: "recurringBookingSeries",
      });

      User.hasMany(models.FoodOrder, {
        foreignKey: "user_id",
        as: "foodOrders",
      });
    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    bank_name: DataTypes.STRING,
    bank_account: DataTypes.STRING,
    role_id: DataTypes.INTEGER,
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpire: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',   // PHẢI LÀ 'User'
    tableName: 'users',  // PHẢI LÀ 'users' (hoặc tên bảng người dùng trong MySQL của bạn)
    timestamps: true,
    underscored: false,
  });
  return User;
};

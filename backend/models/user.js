'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    role_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
  });

  // Mỗi User thuộc một Role
  // Mỗi User có thể sở hữu nhiều Stadiums
  // Mỗi User có nhiều Bookings
  // Mỗi User có nhiều Reviews
  // Mỗi User có nhiều Notifications
  User.associate = function(models) {
    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role'
    });
    User.hasMany(models.Stadium, {
      foreignKey: 'owner_id',
      as: 'stadiums'
    });
    User.hasMany(models.Booking, {
      foreignKey: 'user_id',
      as: 'bookings'
    });
    User.hasMany(models.Review, {
      foreignKey: 'user_id',
      as: 'reviews'
    });
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });
  };

  return User;
};
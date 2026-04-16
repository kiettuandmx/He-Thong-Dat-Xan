'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Booking.init({
    user_id: DataTypes.INTEGER,
    field_id: DataTypes.INTEGER,
    booking_date: DataTypes.DATE,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    total_price: DataTypes.DECIMAL,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Booking',
  });

  // Mỗi Booking thuộc một User
  // Mỗi Booking thuộc một Field
  // Mỗi Booking có thể có một Payment
  // Mỗi Booking có thể có một Review
  Booking.associate = function(models) {
    Booking.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Booking.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field'
    });
    Booking.hasMany(models.Payment, {
      foreignKey: 'booking_id',
      as: 'payments'
    });
    Booking.hasOne(models.Review, {
      foreignKey: 'booking_id',
      as: 'review'
    });
  };

  return Booking;
};
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {

      // Review thuộc về Field
      Review.belongsTo(models.Field, {
        foreignKey: 'field_id',
        as: 'field'
      });

      // Review thuộc về User
      Review.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      // Nếu có booking
      Review.belongsTo(models.Booking, {
        foreignKey: 'booking_id',
        as: 'booking'
      });

      // Nếu bạn dùng stadium_id
      Review.belongsTo(models.Stadium, {
        foreignKey: 'stadium_id',
        as: 'stadium'
      });

    }
  }

  Review.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    field_id: DataTypes.INTEGER,   // THIẾU → thêm vào
    booking_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    stadium_id: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',   // QUAN TRỌNG
    timestamps: false
  });

  return Review;
};
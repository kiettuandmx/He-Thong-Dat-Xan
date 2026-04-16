'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Review.init({
    booking_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    stadium_id: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Review',
  });

  // Mỗi Review thuộc một User (người viết)
  // Mỗi Review thuộc một Stadium (được review)
  // Mỗi Review liên kết với một Booking
  Review.associate = function(models) {
    Review.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Review.belongsTo(models.Stadium, {
      foreignKey: 'stadium_id',
      as: 'stadium'
    });
    Review.belongsTo(models.Booking, {
      foreignKey: 'booking_id',
      as: 'booking'
    });
  };

  return Review;
};
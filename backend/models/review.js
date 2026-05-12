'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      // Kiểm tra models.User trước khi gọi belongsTo
      if (models.User) {
        Review.belongsTo(models.User, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }
      
      // Kiểm tra models.Field trước khi gọi belongsTo
      if (models.Field) {
        Review.belongsTo(models.Field, {
          foreignKey: 'field_id',
          as: 'field'
        });
      }
    }
  }

  Review.init({
    user_id: DataTypes.INTEGER,
    field_id: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    comment: DataTypes.TEXT,
    owner_reply: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true
  });

  return Review;
};
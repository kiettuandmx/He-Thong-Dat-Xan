'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Hashtag extends Model {
    static associate(models) {
      // Quan hệ nhiều-nhiều với Stadium qua bảng join StadiumHashtags
      Hashtag.belongsToMany(models.Stadium, {
        through: 'StadiumHashtags',
        as: 'stadiums',
        foreignKey: 'hashtag_id',
        otherKey: 'stadium_id'
      });
    }
  }
  Hashtag.init({
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Hashtag',
    tableName: 'Hashtags'
  });
  return Hashtag;
};

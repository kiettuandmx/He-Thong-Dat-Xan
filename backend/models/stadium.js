'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stadium extends Model {
    static associate(models) {
      // Quan hệ với bảng Locations (Quận/Huyện)
      Stadium.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location'
      });

      // Quan hệ với bảng Fields (Sân nhỏ)
      Stadium.hasMany(models.Field, {
        foreignKey: 'stadium_id',
        as: 'fields' // Lam nên để là 'fields' (số nhiều) để dễ dùng ở Frontend
      });
      
      Stadium.belongsTo(models.User, {
        foreignKey: 'owner_id',
        as: 'owner'
      });

      // Quan hệ nhiều-nhiều với Hashtag qua bảng join StadiumHashtags
      Stadium.belongsToMany(models.Hashtag, {
        through: 'StadiumHashtags',
        as: 'hashtags',
        foreignKey: 'stadium_id',
        otherKey: 'hashtag_id'
      });
    }
  }

  Stadium.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false // Tên sân không nên để trống
    },
    description: DataTypes.TEXT,
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active' // Mặc định là đang hoạt động
    }
  }, {
    sequelize,
    modelName: 'Stadium',
    tableName: 'stadiums', 
    timestamps: true // Vì trong ảnh desc database của Lam có cột createdAt và updatedAt
  });

  return Stadium;
};
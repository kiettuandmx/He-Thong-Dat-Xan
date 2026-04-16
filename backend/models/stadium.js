'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stadium extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Stadium.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    owner_id: DataTypes.INTEGER,
    location_id: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Stadium',
  });

  // Mỗi Stadium sở hữu bởi một User (owner)
  // Mỗi Stadium nằm ở một Location
  // Mỗi Stadium có nhiều Fields
  // Mỗi Stadium có nhiều Reviews
  Stadium.associate = function(models) {
    Stadium.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner'
    });
    Stadium.belongsTo(models.Location, {
      foreignKey: 'location_id',
      as: 'location'
    });
    Stadium.hasMany(models.Field, {
      foreignKey: 'stadium_id',
      as: 'fields'
    });
    Stadium.hasMany(models.Review, {
      foreignKey: 'stadium_id',
      as: 'reviews'
    });
  };

  return Stadium;
};
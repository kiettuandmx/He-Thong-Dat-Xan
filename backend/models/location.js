'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Location.associate = (models) => {
  Location.hasMany(models.Stadium, {
    foreignKey: 'location_id'
  });
};
  Location.init({
    address: DataTypes.STRING,
    district: DataTypes.STRING,
    city: DataTypes.STRING,
    latitude: DataTypes.DECIMAL,
    longitude: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'Location',
  });

  // Một Location có nhiều Stadiums
  Location.associate = function(models) {
    Location.hasMany(models.Stadium, {
      foreignKey: 'location_id',
      as: 'stadiums'
    });
  };

  return Location;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Field.init({
    stadium_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    price_per_hour: DataTypes.DECIMAL,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Field',
  });

  // Mỗi Field thuộc một Stadium
  // Mỗi Field có nhiều FieldImages
  // Mỗi Field có nhiều Schedules
  // Mỗi Field có nhiều Bookings
  Field.associate = function(models) {
    Field.belongsTo(models.Stadium, {
      foreignKey: 'stadium_id',
      as: 'stadium'
    });
    Field.hasMany(models.FieldImage, {
      foreignKey: 'field_id',
      as: 'images'
    });
    Field.hasMany(models.Schedule, {
      foreignKey: 'field_id',
      as: 'schedules'
    });
    Field.hasMany(models.Booking, {
      foreignKey: 'field_id',
      as: 'bookings'
    });
  };

  return Field;
};
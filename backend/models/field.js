'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    static associate(models) {

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

      Field.hasMany(models.Review, {
        foreignKey: 'field_id',
        as: 'reviews'
      });

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
    tableName: 'fields',   // QUAN TRỌNG
    timestamps: false
  });

  return Field;
};
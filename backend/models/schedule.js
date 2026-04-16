'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Schedule.init({
    field_id: DataTypes.INTEGER,
    date: DataTypes.DATE,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    is_available: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Schedule',
  });

  // Mỗi Schedule thuộc một Field
  Schedule.associate = function(models) {
    Schedule.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field'
    });
  };

  return Schedule;
};
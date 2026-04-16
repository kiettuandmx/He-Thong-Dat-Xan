'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FieldImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FieldImage.init({
    field_id: DataTypes.INTEGER,
    image_url: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FieldImage',
  });

  // Mỗi FieldImage thuộc một Field
  FieldImage.associate = function(models) {
    FieldImage.belongsTo(models.Field, {
      foreignKey: 'field_id',
      as: 'field'
    });
  };

  return FieldImage;
};
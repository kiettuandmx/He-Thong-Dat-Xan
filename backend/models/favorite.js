"use strict";

module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define("Favorite", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    field_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Favorite.associate = (models) => {
    Favorite.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    Favorite.belongsTo(models.Field, {
      foreignKey: "field_id",
      as: "field",
    });
  };

  return Favorite;
};

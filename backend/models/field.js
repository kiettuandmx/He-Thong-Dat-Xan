"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    static associate(models) {
      Field.belongsTo(models.Stadium, {
        foreignKey: "stadium_id",
        as: "stadium",
      });

      Field.hasMany(models.FieldImage, {
        foreignKey: "field_id",
        as: "images",
      });

      Field.hasMany(models.Favorite, {
        foreignKey: "field_id",
        as: "favorites",
      });

      if (models.Schedule) {
        Field.hasMany(models.Schedule, {
          foreignKey: "field_id",
          as: "schedules",
        });
      }

      if (models.Booking) {
        Field.hasMany(models.Booking, {
          foreignKey: "field_id",
          as: "bookings",
        });
      }

      if (models.FoodOrder) {
        Field.hasMany(models.FoodOrder, {
          foreignKey: "field_id",
          as: "foodOrders",
        });
      }

      if (models.RecurringBookingSeries) {
        Field.hasMany(models.RecurringBookingSeries, {
          foreignKey: "field_id",
          as: "recurringBookingSeries",
        });
      }

      if (models.Review) {
        Field.hasMany(models.Review, {
          foreignKey: "field_id",
          as: "reviews",
        });
      }
    }
  }

  Field.init(
    {
      stadium_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price_per_hour: {
        type: DataTypes.DECIMAL(10, 2),
        get() {
          const value = this.getDataValue("price_per_hour");
          return value === null ? 0 : parseFloat(value);
        },
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "available",
      },
    },
    {
      sequelize,
      modelName: "Field",
      tableName: "fields",
      timestamps: true,
      underscored: false,
    }
  );

  return Field;
};

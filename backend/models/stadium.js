'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stadium extends Model {
    static associate(models) {
      Stadium.belongsTo(models.Location, {
        foreignKey: 'location_id',
        as: 'location',
      });

      Stadium.hasMany(models.Field, {
        foreignKey: 'stadium_id',
        as: 'fields',
      });

      if (models.MenuItem) {
        Stadium.hasMany(models.MenuItem, {
          foreignKey: 'stadium_id',
          as: 'menuItems',
        });
      }

      Stadium.belongsTo(models.User, {
        foreignKey: 'owner_id',
        as: 'owner',
      });

      if (models.RecurringBookingSeries) {
        Stadium.hasMany(models.RecurringBookingSeries, {
          foreignKey: 'stadium_id',
          as: 'recurringBookingSeries',
        });
      }

      Stadium.belongsToMany(models.Hashtag, {
        through: 'StadiumHashtags',
        as: 'hashtags',
        foreignKey: 'stadium_id',
        otherKey: 'hashtag_id',
      });
    }
  }

  Stadium.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'Stadium',
      tableName: 'stadiums',
      timestamps: true,
    }
  );

  return Stadium;
};

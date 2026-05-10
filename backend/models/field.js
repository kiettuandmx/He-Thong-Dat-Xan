"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    static associate(models) {
      // Quan hệ với Stadium
      Field.belongsTo(models.Stadium, {
        foreignKey: "stadium_id",
        as: "stadium",
      });

      // Quan hệ với Ảnh
      Field.hasMany(models.FieldImage, {
        foreignKey: "field_id",
        as: "images",
      });

      // Quản hệ với Yêu thích
      Field.hasMany(models.Favorite, {
        foreignKey: "field_id",
        as: "favorites",
      });

      // Quan hệ với Lịch đặt
      if (models.Schedule) {
        Field.hasMany(models.Schedule, {
          foreignKey: "field_id",
          as: "schedules",
        });
      }
      //Booking
      if (models.Booking) {
        Field.hasMany(models.Booking, {
          foreignKey: "field_id",
          as: "bookings", // Sau này có thể dùng để lấy danh sách đơn từ sân
        });
      }

      // Quan hệ với Đánh giá
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
        // Dùng STRING cho linh hoạt, tránh lỗi ENUM với tiếng Việt
        type: DataTypes.STRING,
        allowNull: false,
      },
      price_per_hour: {
        // Chuyển sang FLOAT hoặc DECIMAL để tính toán số cho chuẩn
        type: DataTypes.DECIMAL(10, 2),
        get() {
          // Getter này giúp đảm bảo khi lấy ra luôn là số
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
      timestamps: true, // Sequelize sẽ tự hiểu createdAt/updatedAt
      underscored: false, // Để false nếu Lam dùng kiểu CamelCase (createdAt)
    }
  );

  return Field;
};

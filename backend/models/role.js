'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // Một Role có nhiều Users
      if (models.User) { // Đảm bảo tên User phải khớp với modelName trong user.js
        Role.hasMany(models.User, {
          foreignKey: 'role_id',
          as: 'users'
        });
      }
    }
  }
  Role.init({
    role_name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false // Thường bảng Role không cần timestamp
  });
  return Role;
};
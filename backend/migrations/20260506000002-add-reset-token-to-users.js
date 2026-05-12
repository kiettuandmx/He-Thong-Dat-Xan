'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'resetPasswordToken', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'resetPasswordExpire', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'resetPasswordToken');
    await queryInterface.removeColumn('users', 'resetPasswordExpire');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('notifications');
    const columns = [
      ['title', { type: Sequelize.STRING(255), allowNull: true }],
      ['type', { type: Sequelize.STRING(100), allowNull: true }],
      ['target_type', { type: Sequelize.STRING(100), allowNull: true }],
      ['target_id', { type: Sequelize.STRING(100), allowNull: true }],
      ['target_route', { type: Sequelize.STRING(255), allowNull: true }],
    ];

    for (const [name, definition] of columns) {
      if (!table[name]) {
        await queryInterface.addColumn('notifications', name, definition);
      }
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('notifications');
    const columns = ['target_route', 'target_id', 'target_type', 'type', 'title'];

    for (const name of columns) {
      if (table[name]) {
        await queryInterface.removeColumn('notifications', name);
      }
    }
  },
};

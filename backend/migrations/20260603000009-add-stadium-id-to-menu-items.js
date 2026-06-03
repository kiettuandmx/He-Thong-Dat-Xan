'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('menu_items');

    if (!table.stadium_id) {
      await queryInterface.addColumn('menu_items', 'stadium_id', {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'stadiums', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE menu_items mi
      INNER JOIN fields f ON f.id = mi.field_id
      SET mi.stadium_id = f.stadium_id
      WHERE mi.stadium_id IS NULL
    `);

    await queryInterface.changeColumn('menu_items', 'stadium_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: 'stadiums', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    const indexes = await queryInterface.showIndex('menu_items');
    const hasIndex = indexes.some((index) => index.name === 'menu_items_stadium_id_idx');

    if (!hasIndex) {
      await queryInterface.addIndex('menu_items', ['stadium_id'], {
        name: 'menu_items_stadium_id_idx',
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('menu_items');
    const hasIndex = indexes.some((index) => index.name === 'menu_items_stadium_id_idx');

    if (hasIndex) {
      await queryInterface.removeIndex('menu_items', 'menu_items_stadium_id_idx');
    }

    const table = await queryInterface.describeTable('menu_items');
    if (table.stadium_id) {
      await queryInterface.removeColumn('menu_items', 'stadium_id');
    }
  },
};

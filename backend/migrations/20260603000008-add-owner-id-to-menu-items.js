'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('menu_items', 'owner_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.sequelize.query(`
      UPDATE menu_items mi
      INNER JOIN fields f ON f.id = mi.field_id
      INNER JOIN stadiums s ON s.id = f.stadium_id
      SET mi.owner_id = s.owner_id
      WHERE mi.owner_id IS NULL
    `);

    await queryInterface.changeColumn('menu_items', 'owner_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addIndex('menu_items', ['owner_id'], {
      name: 'menu_items_owner_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('menu_items', 'menu_items_owner_id_idx');
    await queryInterface.removeColumn('menu_items', 'owner_id');
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('food_order_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      food_order_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'food_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      menu_item_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'menu_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      unit_price: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
      },
      line_total: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('food_order_items');
  },
};

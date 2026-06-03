'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('booking_payment_receipts');

    if (!table.food_order_id) {
      await queryInterface.addColumn('booking_payment_receipts', 'food_order_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'food_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('booking_payment_receipts');
    if (table.food_order_id) {
      await queryInterface.removeColumn('booking_payment_receipts', 'food_order_id');
    }
  },
};

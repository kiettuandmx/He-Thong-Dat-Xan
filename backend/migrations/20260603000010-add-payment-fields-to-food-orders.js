'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('food_orders');

    if (!table.payment_reference) {
      await queryInterface.addColumn('food_orders', 'payment_reference', {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
    }

    if (!table.payment_recorded_at) {
      await queryInterface.addColumn('food_orders', 'payment_recorded_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('food_orders');

    if (table.payment_recorded_at) {
      await queryInterface.removeColumn('food_orders', 'payment_recorded_at');
    }

    if (table.payment_reference) {
      await queryInterface.removeColumn('food_orders', 'payment_reference');
    }
  },
};

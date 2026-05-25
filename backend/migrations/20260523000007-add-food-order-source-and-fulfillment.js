'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('food_orders', 'order_source', {
      allowNull: false,
      type: Sequelize.STRING(32),
      defaultValue: 'post_booking',
    });

    await queryInterface.addColumn('food_orders', 'fulfillment_method', {
      allowNull: false,
      type: Sequelize.STRING(32),
      defaultValue: 'pickup_at_field',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('food_orders', 'fulfillment_method');
    await queryInterface.removeColumn('food_orders', 'order_source');
  },
};

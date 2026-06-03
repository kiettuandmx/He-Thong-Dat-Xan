'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bookings');

    if (!table.coupon_code) {
      await queryInterface.addColumn('bookings', 'coupon_code', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!table.discount_amount) {
      await queryInterface.addColumn('bookings', 'discount_amount', {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bookings');

    if (table.coupon_code) {
      await queryInterface.removeColumn('bookings', 'coupon_code');
    }

    if (table.discount_amount) {
      await queryInterface.removeColumn('bookings', 'discount_amount');
    }
  }
};

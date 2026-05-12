'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'coupon_code', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('bookings', 'discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bookings', 'coupon_code');
    await queryInterface.removeColumn('bookings', 'discount_amount');
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bookings', 'refund_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('bookings', 'refunded_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bookings', 'refund_reason');
    await queryInterface.removeColumn('bookings', 'refunded_at');
  }
};

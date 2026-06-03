'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('bookings');

    if (!table.payment_reference) {
      await queryInterface.addColumn('bookings', 'payment_reference', {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('bookings');

    if (table.payment_reference) {
      await queryInterface.removeColumn('bookings', 'payment_reference');
    }
  },
};

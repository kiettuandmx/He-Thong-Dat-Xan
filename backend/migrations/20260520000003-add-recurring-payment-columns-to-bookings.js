'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('bookings');

    if (!table.recurring_series_id) {
      await queryInterface.addColumn('bookings', 'recurring_series_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'recurring_booking_series', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.remaining_amount) {
      await queryInterface.addColumn('bookings', 'remaining_amount', {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!table.payment_due_date) {
      await queryInterface.addColumn('bookings', 'payment_due_date', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('bookings');

    if (table.payment_due_date) {
      await queryInterface.removeColumn('bookings', 'payment_due_date');
    }

    if (table.remaining_amount) {
      await queryInterface.removeColumn('bookings', 'remaining_amount');
    }

    if (table.recurring_series_id) {
      await queryInterface.removeColumn('bookings', 'recurring_series_id');
    }
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'recurring_series_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'recurring_booking_series', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('bookings', 'remaining_amount', {
      type: Sequelize.DECIMAL(12, 0),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('bookings', 'payment_due_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('bookings', 'payment_due_date');
    await queryInterface.removeColumn('bookings', 'remaining_amount');
    await queryInterface.removeColumn('bookings', 'recurring_series_id');
  },
};

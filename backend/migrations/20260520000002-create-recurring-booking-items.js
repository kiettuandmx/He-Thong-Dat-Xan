'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recurring_booking_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      series_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'recurring_booking_series', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      booking_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      scheduled_date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      start_time: {
        allowNull: false,
        type: Sequelize.TIME,
      },
      end_time: {
        allowNull: false,
        type: Sequelize.TIME,
      },
      base_price: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
      },
      amount_paid: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
        defaultValue: 0,
      },
      remaining_amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
        defaultValue: 0,
      },
      payment_due_date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      item_status: {
        allowNull: false,
        type: Sequelize.STRING(64),
      },
      was_rescheduled: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      original_date_time: {
        allowNull: true,
        type: Sequelize.STRING(255),
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
    await queryInterface.dropTable('recurring_booking_items');
  },
};

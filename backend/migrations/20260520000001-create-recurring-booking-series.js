'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recurring_booking_series', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      field_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'fields', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      stadium_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'stadiums', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recurrence_type: {
        allowNull: false,
        type: Sequelize.STRING(32),
      },
      start_date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      end_date: {
        allowNull: true,
        type: Sequelize.DATEONLY,
      },
      occurrence_count: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      preferred_day_of_week: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      preferred_start_time: {
        allowNull: false,
        type: Sequelize.TIME,
      },
      preferred_end_time: {
        allowNull: false,
        type: Sequelize.TIME,
      },
      total_estimated_amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
      },
      deposit_amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
      },
      deposit_percent: {
        allowNull: false,
        type: Sequelize.DECIMAL(5, 2),
      },
      approval_status: {
        allowNull: false,
        type: Sequelize.STRING(64),
      },
      payment_status_summary: {
        allowNull: false,
        type: Sequelize.STRING(64),
        defaultValue: 'partially_paid',
      },
      created_by: {
        allowNull: false,
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('recurring_booking_series');
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('food_orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      booking_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      status: {
        allowNull: false,
        type: Sequelize.STRING(32),
        defaultValue: 'pending',
      },
      total_amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
      },
      payment_method: {
        allowNull: true,
        type: Sequelize.STRING(32),
      },
      payment_status: {
        allowNull: false,
        type: Sequelize.STRING(32),
        defaultValue: 'unpaid',
      },
      ordered_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    await queryInterface.dropTable('food_orders');
  },
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('booking_payment_receipts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      provider: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'sepay',
      },
      provider_transaction_id: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      payment_reference: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      transfer_amount: {
        type: Sequelize.DECIMAL(12, 0),
        allowNull: false,
      },
      transfer_content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      matched_status: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      matched_reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      raw_payload: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

  down: async (queryInterface) => {
    await queryInterface.dropTable('booking_payment_receipts');
  },
};

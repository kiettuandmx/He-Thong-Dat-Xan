'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      wallet_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'wallets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      booking_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'bookings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'success',
      },
      amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
      },
      balance_before: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
        defaultValue: 0,
      },
      balance_after: {
        allowNull: false,
        type: Sequelize.DECIMAL(12, 0),
        defaultValue: 0,
      },
      description: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      reference_type: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      reference_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      metadata: {
        allowNull: true,
        type: Sequelize.JSON,
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
    await queryInterface.dropTable('wallet_transactions');
  },
};

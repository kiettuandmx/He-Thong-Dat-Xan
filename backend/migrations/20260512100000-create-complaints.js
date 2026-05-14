'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('complaints', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      stadium_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'stadiums',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      field_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fields',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      evidence_urls: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'investigating', 'resolved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      assigned_admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      resolution_type: {
        type: Sequelize.ENUM('refund_user', 'penalize_owner', 'no_action'),
        allowNull: true,
      },
      resolution_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      penalty_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('complaints', ['user_id']);
    await queryInterface.addIndex('complaints', ['booking_id']);
    await queryInterface.addIndex('complaints', ['stadium_id']);
    await queryInterface.addIndex('complaints', ['status']);
    await queryInterface.addIndex('complaints', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('complaints');
  },
};


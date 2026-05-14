'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AdminActivityLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      target_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      target_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      before_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      after_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('AdminActivityLogs', ['admin_id']);
    await queryInterface.addIndex('AdminActivityLogs', ['action']);
    await queryInterface.addIndex('AdminActivityLogs', ['target_type', 'target_id']);
    await queryInterface.addIndex('AdminActivityLogs', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('AdminActivityLogs');
  },
};


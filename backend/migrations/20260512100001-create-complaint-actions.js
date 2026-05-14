'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('complaint_actions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      complaint_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'complaints',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      note: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('complaint_actions', ['complaint_id']);
    await queryInterface.addIndex('complaint_actions', ['admin_id']);
    await queryInterface.addIndex('complaint_actions', ['action']);
    await queryInterface.addIndex('complaint_actions', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('complaint_actions');
  },
};


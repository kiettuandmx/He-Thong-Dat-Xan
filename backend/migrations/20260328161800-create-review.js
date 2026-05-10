'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      stadium_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Stadiums',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      field_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Fields',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      booking_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Bookings',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      rating: {
        type: Sequelize.INTEGER
      },
      comment: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Reviews');
  }
};
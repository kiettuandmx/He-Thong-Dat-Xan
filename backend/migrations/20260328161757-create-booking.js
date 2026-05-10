'use strict';
/**
 * Migration: Tạo bảng Bookings (Đặt sân)
 * Tham chiếu: Users (user_id), Fields (field_id)
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      field_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Fields',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      stadium_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Stadiums',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      booking_date: {
        type: Sequelize.DATEONLY
      },
      start_time: {
        type: Sequelize.TIME
      },
      end_time: {
        type: Sequelize.TIME
      },
      total_price: {
        type: Sequelize.DECIMAL
      },
      status: {
        type: Sequelize.STRING
      },
      amount_paid: {
        type: Sequelize.INTEGER, // Để INTEGER cho dễ tính toán tiền
        allowNull: true,
        defaultValue: 0
      },
      payment_type: {
        type: Sequelize.STRING, // 'full' hoặc 'deposit'
        allowNull: true
      },
      payment_status: {
        type: Sequelize.STRING, // 'unpaid', 'paid'
        allowNull: true,
        defaultValue: 'unpaid'
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('Bookings');
  }
};
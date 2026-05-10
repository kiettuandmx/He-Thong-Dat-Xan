'use strict';
/**
 * Migration: Thêm cột reject_reason vào bảng Bookings
 * Dùng để lưu lý do khi chủ sân từ chối đơn đặt sân
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Bookings', 'reject_reason', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Bookings', 'reject_reason');
  }
};

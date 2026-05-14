'use strict';
// Migration này đã bị hoàn tác - không làm gì cả
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cột 'link' đã tồn tại trong DB (được thêm bởi Sequelize sync)
    // Không cần làm gì thêm
  },
  async down(queryInterface, Sequelize) {
    // Không làm gì
  }
};

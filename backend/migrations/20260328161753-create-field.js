'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Fields', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type: {
        allowNull: false,
        type: Sequelize.STRING // 'Bóng đá', 'Pickleball', v.v.
      },
      price_per_hour: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2)
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'available'
      },
      stadium_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Stadiums', // Đảm bảo bảng Stadiums phải được tạo TRƯỚC bảng này
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // HAI CỘT QUAN TRỌNG NHẤT ĐỂ FIX LỖI SEED
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Fields');
  }
};
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StadiumHashtags', {
      stadium_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Stadiums',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
      },
      hashtag_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Hashtags',
          key: 'id'
        },
        onDelete: 'CASCADE',
        primaryKey: true
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
    await queryInterface.dropTable('StadiumHashtags');
  }
};

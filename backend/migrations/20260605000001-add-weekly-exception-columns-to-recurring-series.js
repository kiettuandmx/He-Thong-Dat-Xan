'use strict';

async function getTableDefinition(queryInterface, tableName) {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return null;
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'recurring_booking_series';
    const table = await getTableDefinition(queryInterface, tableName);
    if (!table) return;

    if (!table.weekday) {
      await queryInterface.addColumn(tableName, 'weekday', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.repeat_interval_weeks) {
      await queryInterface.addColumn(tableName, 'repeat_interval_weeks', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
    }
  },

  async down(queryInterface) {
    const tableName = 'recurring_booking_series';
    const table = await getTableDefinition(queryInterface, tableName);
    if (!table) return;

    if (table.repeat_interval_weeks) {
      await queryInterface.removeColumn(tableName, 'repeat_interval_weeks');
    }

    if (table.weekday) {
      await queryInterface.removeColumn(tableName, 'weekday');
    }
  },
};

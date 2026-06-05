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
    const tableName = 'recurring_booking_items';
    const table = await getTableDefinition(queryInterface, tableName);
    if (!table) return;

    if (!table.is_exception) {
      await queryInterface.addColumn(tableName, 'is_exception', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!table.is_skipped) {
      await queryInterface.addColumn(tableName, 'is_skipped', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!table.sequence_number) {
      await queryInterface.addColumn(tableName, 'sequence_number', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableName = 'recurring_booking_items';
    const table = await getTableDefinition(queryInterface, tableName);
    if (!table) return;

    if (table.sequence_number) {
      await queryInterface.removeColumn(tableName, 'sequence_number');
    }

    if (table.is_skipped) {
      await queryInterface.removeColumn(tableName, 'is_skipped');
    }

    if (table.is_exception) {
      await queryInterface.removeColumn(tableName, 'is_exception');
    }
  },
};

process.env.SKIP_AUTO_SYNC = 'true';

require('dotenv').config({ path: './backend/.env' });

const { sequelize } = require('../models');

async function main() {
  const [districts] = await sequelize.query(
    "SELECT DISTINCT district FROM locations WHERE district IS NOT NULL AND district <> '' ORDER BY district LIMIT 50"
  );

  const [fields] = await sequelize.query(
    `SELECT f.id, f.name, f.type, f.price_per_hour, s.name AS stadium_name, l.district
     FROM fields f
     JOIN stadiums s ON s.id = f.stadium_id
     LEFT JOIN locations l ON l.id = s.location_id
     ORDER BY f.id
     LIMIT 50`
  );

  console.log(
    JSON.stringify(
      {
        districts,
        fields,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });

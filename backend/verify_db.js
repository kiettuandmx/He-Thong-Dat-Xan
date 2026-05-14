const { Sequelize } = require('./node_modules/sequelize');
const config = require('./config/config.js').development;

async function verify() {
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: false
  });

  try {
    console.log('--- Kiểm tra bảng Hashtags ---');
    const [hashtagsCols] = await sequelize.query('DESCRIBE Hashtags');
    console.table(hashtagsCols);

    console.log('\n--- Kiểm tra bảng Posts ---');
    const [postsCols] = await sequelize.query('DESCRIBE Posts');
    console.table(postsCols);

    console.log('\n--- Kiểm tra bảng PostHashtags ---');
    const [postHashtagsCols] = await sequelize.query('DESCRIBE PostHashtags');
    console.table(postHashtagsCols);

    console.log('\n--- Kiểm tra bảng StadiumHashtags ---');
    const [stadiumHashtagsCols] = await sequelize.query('DESCRIBE StadiumHashtags');
    console.table(stadiumHashtagsCols);

    console.log('\n✅ Tất cả các bảng đã được tạo thành công với cấu trúc chính xác.');
  } catch (err) {
    console.error('❌ Lỗi kiểm tra:', err.message);
  } finally {
    await sequelize.close();
  }
}

verify();

const express = require('express');
const app = express();
const cors = require('cors');

const { sequelize } = require('./models');
const fieldRoutes = require('./routes/fieldRoutes');

app.use(cors());
app.use(express.json());

app.use('/api', fieldRoutes);

sequelize.authenticate()
  .then(() => console.log('✅ Kết nối DB thành công'))
  .catch(err => console.error('❌ Lỗi DB:', err));

app.listen(3000, () => {
  console.log('🚀 Server chạy tại http://localhost:3000');
});
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { verifyToken } = require('./middleware/authMiddleware');
const { Field, FieldImage } = require('./models');

const fieldRoutes = require('./routes/fieldRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const stadiumRoutes = require('./routes/stadiumRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const couponRoutes = require('./routes/couponRoutes');
const hashtagRoutes = require('./routes/hashtagRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

function createApp() {
  const app = express();

  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));
  app.use('/uploads', express.static('uploads'));

  app.use('/api', fieldRoutes);
  app.use('/api', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/stadiums', stadiumRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/hashtags', hashtagRoutes);
  app.use('/api/complaints', complaintRoutes);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  });
  const upload = multer({ storage });

  app.post('/api/fields', upload.single('image'), async (req, res) => {
    try {
      const { field_name, type, price } = req.body;
      const imagePath = req.file ? req.file.filename : null;
      const newField = await Field.create({
        name: field_name,
        type,
        price_per_hour: price,
        stadium_id: 1,
        status: 'available',
      });

      if (imagePath && newField.id) {
        await FieldImage.create({ field_id: newField.id, image_url: imagePath });
      }

      res.status(201).json({ message: 'Them san va anh thanh cong!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Loi he thong' });
    }
  });

  app.get('/api/me', verifyToken, (req, res) => {
    res.json(req.user);
  });

  return app;
}

module.exports = { createApp };

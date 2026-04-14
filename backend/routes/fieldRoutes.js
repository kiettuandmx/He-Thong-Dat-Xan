const express = require('express');
const router = express.Router();

const {
  Field,
  Stadium,
  Location,
  FieldImage,
  Schedule,
  Review
} = require('../models');

// GET ALL FIELDS
router.get('/fields', async (req, res) => {
  try {
    const fields = await Field.findAll({
      include: [
        {
          model: Stadium,
          as: 'stadium',
          include: [
            {
              model: Location,
              as: 'location' // 👈 nếu bạn có define bên Stadium
            }
          ]
        },
        {
          model: FieldImage,
          as: 'images'
        }
      ]
    });

    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET FIELD BY ID
router.get('/fields/:id', async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id, {
      include: [
        {
          model: Stadium,
          as: 'stadium',
          include: [
            {
              model: Location,
              as: 'location'
            }
          ]
        },
        {
          model: FieldImage,
          as: 'images'
        },
        {
          model: Schedule,
          as: 'schedules'
        },
        {
          model: Review,
          as: 'reviews'
        }
      ]
    });

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.json(field);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
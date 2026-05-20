const express = require('express');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const menuController = require('../controllers/menuController');

const router = express.Router();

router.get('/fields/:fieldId/menu', menuController.getFieldMenu);
router.post('/fields/:fieldId/menu', verifyToken, checkRole([2]), menuController.createMenuItem);

module.exports = router;

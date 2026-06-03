const express = require('express');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const menuController = require('../controllers/menuController');

const router = express.Router();

router.get('/stadiums/:stadiumId/menu', menuController.getStadiumMenu);
router.post('/stadiums/:stadiumId/menu', verifyToken, checkRole([2]), menuController.createMenuItem);
router.put('/items/:id', verifyToken, checkRole([2]), menuController.updateMenuItem);
router.patch('/items/:id/availability', verifyToken, checkRole([2]), menuController.updateMenuItemAvailability);
router.delete('/items/:id', verifyToken, checkRole([2]), menuController.deleteMenuItem);

module.exports = router;

const express = require('express');
const router = express.Router();
const stadiumController = require('../controllers/stadiumController');
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', stadiumController.getAllStadiums);
router.get('/owner/stats/:ownerId', verifyToken, dashboardController.getOwnerStats);
router.get('/owner/:ownerId', verifyToken, stadiumController.getOwnerStadiums);
router.get('/:id', stadiumController.getStadiumById);
router.post('/', verifyToken, stadiumController.createStadium);
router.put('/:id', verifyToken, stadiumController.updateStadium);
router.delete('/:id', verifyToken, stadiumController.deleteStadium);
module.exports = router;

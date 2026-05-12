const express = require('express');
const router = express.Router();
const stadiumController = require('../controllers/stadiumController');
const dashboardController = require('../controllers/dashboardController');
// Tạm thời để trống hoặc viết logic lấy sân ở đây
router.get('/', stadiumController.getAllStadiums);
router.get('/:id', stadiumController.getStadiumById);
router.post('/', stadiumController.createStadium);
router.put('/:id', stadiumController.updateStadium);
router.delete('/:id', stadiumController.deleteStadium);
router.get('/owner/stats/:ownerId', dashboardController.getOwnerStats);
router.get('/owner/:ownerId', stadiumController.getOwnerStadiums);
module.exports = router;
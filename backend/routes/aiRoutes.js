const express = require('express');
const { postChat } = require('../controllers/aiController');

const router = express.Router();

router.post('/chat', postChat);

module.exports = router;


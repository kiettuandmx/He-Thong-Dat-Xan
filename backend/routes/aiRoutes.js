const express = require('express');
const { postChat, postChatStream } = require('../controllers/aiController');

const router = express.Router();

router.post('/chat', postChat);
router.post('/chat/stream', postChatStream);

module.exports = router;

const { sendChatMessage } = require('../utils/aiServiceClient');

async function postChat(req, res) {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const result = await sendChatMessage(message);
    return res.json(result);
  } catch (error) {
    return res.status(502).json({ error: 'AI service unavailable' });
  }
}

module.exports = { postChat };


const { sendChatMessage, streamChatMessage } = require('../utils/aiServiceClient');

async function postChat(req, res) {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const result = await sendChatMessage(message);
    return res.json(result);
  } catch (error) {
    return res.status(502).json({ error: error.message || 'AI service unavailable' });
  }
}
async function postChatStream(req, res) {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const abortController = new AbortController();
  req.on('aborted', () => abortController.abort());
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const upstreamResponse = await streamChatMessage(message, abortController.signal);
    const reader = upstreamResponse.body.getReader();

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      res.write(Buffer.from(value));
      res.flush?.();
    }

    return res.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(502).json({ error: error.message || 'AI service unavailable' });
    }

    return res.end();
  }
}

module.exports = { postChat, postChatStream };

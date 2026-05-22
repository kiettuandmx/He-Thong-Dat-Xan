const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('POST /api/ai/chat returns 400 when message is missing', async () => {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_AUTO_SYNC = 'true';
  const { createApp } = require('../app');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

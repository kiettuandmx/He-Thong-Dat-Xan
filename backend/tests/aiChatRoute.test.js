const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

function requestJson(port, path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data ? JSON.parse(data) : null });
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

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

test('POST /api/ai/chat forwards upstream recommendation failure as 502', async () => {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_AUTO_SYNC = 'true';
  const { createApp } = require('../app');
  const app = createApp();
  const server = http.createServer(app);

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 502,
    json: async () => ({ detail: 'OPENROUTER_API_KEY is not configured' }),
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await requestJson(port, '/api/ai/chat', { message: 'san bong da quan 7' });

    assert.equal(response.statusCode, 502);
    assert.equal(response.body.error, 'OPENROUTER_API_KEY is not configured');
  } finally {
    global.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/ai/chat/stream returns 400 when message is missing', async () => {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_AUTO_SYNC = 'true';
  const { createApp } = require('../app');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

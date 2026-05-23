const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://127.0.0.1:8000';

async function buildUpstreamError(response, fallbackMessage) {
  try {
    const payload = await response.json();
    const message = payload?.error || payload?.detail || fallbackMessage;
    return new Error(message);
  } catch {
    return new Error(fallbackMessage);
  }
}

async function sendChatMessage(message) {
  const response = await fetch(`${AI_SERVICE_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw await buildUpstreamError(response, `AI service failed with status ${response.status}`);
  }

  return response.json();
}

async function streamChatMessage(message, signal) {
  const response = await fetch(`${AI_SERVICE_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw await buildUpstreamError(response, `AI service failed with status ${response.status}`);
  }

  return response;
}

module.exports = { sendChatMessage, streamChatMessage };

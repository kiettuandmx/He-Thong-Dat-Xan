const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://127.0.0.1:8000';

async function sendChatMessage(message) {
  const response = await fetch(`${AI_SERVICE_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`AI service failed with status ${response.status}`);
  }

  return response.json();
}

module.exports = { sendChatMessage };


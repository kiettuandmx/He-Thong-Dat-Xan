import axios from 'axios';

export async function sendAiChat(message) {
  const response = await axios.post('/api/ai/chat', { message });
  return response.data;
}

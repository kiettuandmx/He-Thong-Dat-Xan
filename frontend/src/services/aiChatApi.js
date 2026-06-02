export async function streamAiChat(message, handlers = {}) {
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok || !response.body) {
    throw new Error(await readErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalPayload = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parsed = consumeSseBuffer(buffer);
    buffer = parsed.remaining;

    for (const event of parsed.events) {
      if (event.name === 'token') {
        handlers.onToken?.(event.payload.content || '');
      }

      if (event.name === 'meta') {
        handlers.onMeta?.(event.payload);
      }

      if (event.name === 'done') {
        finalPayload = event.payload;
        handlers.onDone?.(event.payload);
      }

      if (event.name === 'error') {
        handlers.onError?.(event.payload);
      }
    }
  }

  return finalPayload;
}

async function readErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload?.error || payload?.detail || 'AI service unavailable';
  } catch {
    return 'AI service unavailable';
  }
}

function consumeSseBuffer(buffer) {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const remaining = parts.pop() ?? '';
  const events = parts.map(parseSseEvent).filter(Boolean);
  return { events, remaining };
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split('\n');
  let name = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      name = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  try {
    return {
      name,
      payload: JSON.parse(dataLines.join('\n')),
    };
  } catch {
    return {
      name,
      payload: { content: dataLines.join('\n') },
    };
  }
}

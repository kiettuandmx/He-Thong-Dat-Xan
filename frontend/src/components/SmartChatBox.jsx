import { useEffect, useMemo, useRef, useState } from 'react';
import { streamAiChat } from '../services/aiChatApi';
import RecommendedFieldCard from './RecommendedFieldCard';
import './SmartChatBox.css';

const SmartChatBox = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(20, Math.min(textarea.scrollHeight, 78))}px`;
  }, [message, isOpen]);

  const canSubmit = useMemo(() => !loading && message.trim().length > 0, [loading, message]);

  const handleComposerKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const userMessage = {
      id: createMessageId('user'),
      role: 'user',
      text: trimmedMessage,
    };
    const assistantMessageId = createMessageId('assistant');

    setLoading(true);
    setError('');
    setMessage('');
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        text: '',
        recommendations: [],
        status: 'streaming',
      },
    ]);

    try {
      await streamAiChat(trimmedMessage, {
        onToken: (chunk) => {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantMessageId
                ? { ...item, text: `${item.text || ''}${chunk}`, status: 'streaming' }
                : item
            )
          );
        },
        onDone: (payload) => {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantMessageId
                ? {
                    ...item,
                    text: payload.answer || item.text,
                    recommendations: payload.recommendations || [],
                    status: 'done',
                  }
                : item
            )
          );
        },
        onError: (errorPayload) => {
          setMessages((prev) => prev.filter((item) => item.id !== assistantMessageId));
          setError(errorPayload?.message || 'Không thể nhận phản hồi từ AI. Vui lòng thử lại sau.');
        },
      });
    } catch {
      setMessages((prev) => prev.filter((item) => item.id !== assistantMessageId));
      setError('Không thể nhận phản hồi từ AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`smart-chat-fab ${isOpen ? 'is-open' : ''}`}>
      {isOpen ? (
        <div className="smart-chat-widget surface-card">
          <header className="smart-chat-widget__header">
            <div className="smart-chat-widget__brand">
              <span className="smart-chat-widget__logo">S</span>
              <div>
                <h2 className="smart-chat-widget__title">Sân Việt</h2>
                <p className="smart-chat-widget__subtitle">Trợ lý tư vấn sân theo thời gian thực</p>
              </div>
            </div>

            <button
              type="button"
              className="smart-chat-widget__toggle"
              aria-label="Thu gọn trợ lý Sân Việt"
              onClick={() => setIsOpen(false)}
            >
              -
            </button>
          </header>

          <div className="smart-chat-widget__body" ref={scrollRef}>
            {messages.map((entry) => (
              <article
                key={entry.id}
                className={`chat-message chat-message--${entry.role} ${entry.status === 'streaming' ? 'chat-message--streaming' : ''}`}
              >
                {entry.role === 'assistant' ? <span className="chat-message__avatar">S</span> : null}
                <div className="chat-message__content">
                  <div className="chat-message__bubble">
                    {entry.status === 'streaming' && !entry.text ? <TypingDots /> : null}
                    {entry.text ? (
                      <div className="chat-message__text" style={{ whiteSpace: 'pre-line' }}>
                        {entry.text}
                      </div>
                    ) : null}
                  </div>

                  {entry.role === 'assistant' && entry.recommendations?.length ? (
                    <div className="chat-message__recommendations">
                      {entry.recommendations.filter((field) => field?.field_id).map((field) => (
                        <RecommendedFieldCard key={field.field_id} field={field} compact />
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <footer className="smart-chat-widget__footer">
            <form className="smart-chat-widget__composer" onSubmit={handleSubmit}>
              <textarea
                id="smart-chat-message"
                className="smart-chat-widget__textarea"
                rows="1"
                ref={textareaRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Nhập tin nhắn... ví dụ: sân bóng đá 10 người giá hợp lý tại Bình Thạnh"
              />
              <button type="submit" className="smart-chat-widget__send" disabled={!canSubmit} aria-label="Gửi tin nhắn">
                <span className="smart-chat-widget__send-icon">{'>'}</span>
              </button>
            </form>
            {error ? <p className="smart-chat-widget__error">{error}</p> : null}
          </footer>
        </div>
      ) : (
        <button
          type="button"
          className="smart-chat-fab__button"
          aria-label="Mở trợ lý Sân Việt"
          onClick={() => setIsOpen(true)}
        >
          <span className="smart-chat-fab__icon">S</span>
          <span className="smart-chat-fab__label">Trợ lý AI</span>
        </button>
      )}
    </div>
  );
};

const TypingDots = () => (
  <div className="typing-dots" aria-label="Trợ lý đang trả lời">
    <span />
    <span />
    <span />
  </div>
);

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default SmartChatBox;

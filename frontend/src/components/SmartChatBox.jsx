import { useState } from 'react';
import { sendAiChat } from '../services/aiChatApi';
import RecommendedFieldCard from './RecommendedFieldCard';

const SmartChatBox = () => {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await sendAiChat(message);
      setResult(data);
    } catch {
      setError('Tro ly tam thoi chua san sang. Vui long thu lai sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          <label className="form-label fw-semibold" htmlFor="smart-chat-message">
            Mo ta nhu cau cua ban
          </label>
          <textarea
            id="smart-chat-message"
            className="form-control mb-3"
            rows="4"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Vi du: Toi muon da toi nay, 10 nguoi, gia vua phai, gan Quan 7"
          />
          <button type="submit" className="btn btn-success" disabled={loading || !message.trim()}>
            {loading ? 'Dang tu van...' : 'Nhan goi y'}
          </button>
        </form>

        {error ? <p className="text-danger mt-3 mb-0">{error}</p> : null}
        {result?.answer ? <p className="mt-4 mb-3">{result.answer}</p> : null}

        {result?.recommendations?.length ? (
          <div className="mt-3">
            {result.recommendations.map((field) => (
              <RecommendedFieldCard key={field.field_id} field={field} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SmartChatBox;

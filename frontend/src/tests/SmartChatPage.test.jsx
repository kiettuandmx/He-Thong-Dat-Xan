import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RecommendedFieldCard from '../components/RecommendedFieldCard';
import SmartChatBox from '../components/SmartChatBox';
import SmartChatPage from '../pages/SmartChatPage';
import { streamAiChat } from '../services/aiChatApi';

vi.mock('../services/aiChatApi', () => ({
  streamAiChat: vi.fn(() => Promise.resolve({ answer: 'Da gui', recommendations: [], constraints: null })),
}));

test('renders chat heading', () => {
  render(<SmartChatPage />);
  expect(screen.getByText(/Chatbox tư vấn sân theo kiểu hội thoại thời gian thực/i)).toBeInTheDocument();
});

test('renders a floating bubble by default and opens the chat window on click', () => {
  render(
    <MemoryRouter>
      <SmartChatBox />
    </MemoryRouter>
  );

  expect(screen.getByRole('button', { name: /mở trợ lý sân việt/i })).toBeInTheDocument();
  expect(screen.queryByText(/trợ lý tư vấn sân theo thời gian thực/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /mở trợ lý sân việt/i }));

  expect(screen.getByText(/trợ lý tư vấn sân theo thời gian thực/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /thu gọn trợ lý sân việt/i })).toBeInTheDocument();
});

test('collapses the chat window back into a floating bubble', () => {
  render(
    <MemoryRouter>
      <SmartChatBox />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /mở trợ lý sân việt/i }));
  fireEvent.click(screen.getByRole('button', { name: /thu gọn trợ lý sân việt/i }));

  expect(screen.getByRole('button', { name: /mở trợ lý sân việt/i })).toBeInTheDocument();
  expect(screen.queryByText(/trợ lý tư vấn sân theo thời gian thực/i)).not.toBeInTheDocument();
});

test('grows the chat textarea to match multiline content', () => {
  render(
    <MemoryRouter>
      <SmartChatBox />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /mở trợ lý sân việt/i }));

  const textarea = screen.getByPlaceholderText(/Nhập tin nhắn/i);
  Object.defineProperty(textarea, 'scrollHeight', {
    configurable: true,
    value: 72,
  });

  fireEvent.change(textarea, { target: { value: 'dong 1\ndong 2\ndong 3' } });

  expect(textarea.style.height).toBe('72px');
});

test('submits the message when pressing Enter inside the chat textarea', async () => {
  render(
    <MemoryRouter>
      <SmartChatBox />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /mở trợ lý sân việt/i }));

  const textarea = screen.getByPlaceholderText(/Nhập tin nhắn/i);
  fireEvent.change(textarea, { target: { value: 'san bong da quan 7' } });
  fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

  await waitFor(() => {
    expect(streamAiChat).toHaveBeenCalledWith(
      'san bong da quan 7',
      expect.objectContaining({
        onToken: expect.any(Function),
        onDone: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });
});

test('renders compact recommendation cards as links when field_id is present', () => {
  render(
    <MemoryRouter>
      <RecommendedFieldCard
        compact
        field={{
          field_id: 12,
          name: 'San Bong Da',
          reasons: ['Gan khu vuc Quan 10'],
        }}
      />
    </MemoryRouter>
  );

  expect(screen.getByRole('link', { name: /san bong da/i })).toHaveAttribute('href', '/field/12');
});

test('does not render broken clickable recommendations when field_id is missing', async () => {
  streamAiChat.mockImplementationOnce(async (_message, handlers) => {
    handlers.onDone?.({
      answer: 'Minh co 2 goi y.',
      recommendations: [
        { field_id: 33, name: 'San 7 Phu My', reasons: ['Gan khu vuc Quan 7'] },
        { name: 'San khong co id', reasons: ['Du lieu khong hop le'] },
      ],
      constraints: null,
    });
    return { answer: 'Minh co 2 goi y.', recommendations: [], constraints: null };
  });

  render(
    <MemoryRouter>
      <SmartChatBox />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /mở trợ lý sân việt/i }));

  const textarea = screen.getByPlaceholderText(/Nhập tin nhắn/i);
  fireEvent.change(textarea, { target: { value: 'goi y san' } });
  fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

  await waitFor(() => {
    expect(screen.getByRole('link', { name: /san 7 phu my/i })).toHaveAttribute('href', '/field/33');
  });

  expect(screen.queryByText(/san khong co id/i)).not.toBeInTheDocument();
});

test('clickable compact recommendation preserves reasons content', () => {
  render(
    <MemoryRouter>
      <RecommendedFieldCard
        compact
        field={{
          field_id: 33,
          name: 'San 7 Phu My',
          reasons: ['Gan khu vuc Quan 7', 'Muc gia Gia vua phai'],
        }}
      />
    </MemoryRouter>
  );

  expect(screen.getByRole('link', { name: /san 7 phu my/i })).toBeInTheDocument();
  expect(screen.getByText(/Gan khu vuc Quan 7/i)).toBeInTheDocument();
});

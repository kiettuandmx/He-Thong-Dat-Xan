import { render, screen } from '@testing-library/react';
import SmartChatPage from '../pages/SmartChatPage';

test('renders chat heading', () => {
  render(<SmartChatPage />);
  expect(screen.getByText(/Tro ly dat san thong minh/i)).toBeInTheDocument();
});

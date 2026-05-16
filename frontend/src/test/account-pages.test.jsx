import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FavoritesPage from '../pages/FavoritesPage';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('Trang tài khoản', () => {
  it('hiển thị tiêu đề trang yêu thích bằng tiếng Việt', async () => {
    render(<FavoritesPage />);

    expect(screen.getByRole('heading', { name: /sân yêu thích/i })).toBeInTheDocument();
    expect(
      await screen.findByText(/bạn chưa lưu sân nào/i)
    ).toBeInTheDocument();
  });
});

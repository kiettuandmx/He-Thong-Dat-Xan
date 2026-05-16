import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OwnerReviews from '../pages/OwnerReviews';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
  },
}));

describe('OwnerReviews', () => {
  it('renders owner review heading and empty state in Vietnamese', async () => {
    localStorage.setItem('user', JSON.stringify({ token: 'demo-token' }));

    render(<OwnerReviews />);

    expect(await screen.findByRole('heading', { name: /đánh giá khách hàng/i })).toBeInTheDocument();
    expect(screen.getAllByText(/chất lượng dịch vụ/i).length).toBeGreaterThan(0);
  });
});

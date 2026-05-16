import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FieldCard from '../components/FieldCard';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Thẻ sân', () => {
  it('hiển thị vị trí, giá và nút đặt sân bằng tiếng Việt', () => {
    render(
      <MemoryRouter>
        <FieldCard
          detailPath="/field/1"
          field={{
            id: 1,
            name: 'Sân Bảy Phúc',
            address: 'Quận 7, TP. Hồ Chí Minh',
            price: 250000,
            image: 'https://example.com/field.jpg',
            type: 'football',
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/quận 7/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xem lịch và đặt sân/i })).toBeInTheDocument();
  });
});

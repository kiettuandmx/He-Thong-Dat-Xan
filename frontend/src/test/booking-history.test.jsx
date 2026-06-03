import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import BookingHistory from '../pages/BookingHistory';

vi.mock('axios');

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      user: {
        id: 7,
        role_id: 1,
      },
    },
  }),
}));

vi.mock('../components/ReviewModal', () => ({
  default: () => null,
}));

vi.mock('../components/ComplaintModal', () => ({
  default: () => null,
}));

vi.mock('../components/AccountPageHeader', () => ({
  default: ({ title, description, action }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {action}
    </div>
  ),
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe('BookingHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      'user',
      JSON.stringify({
        token: 'demo-token',
        user: { id: 7, role_id: 1 },
      })
    );

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    const activeStartHour = String(Math.max(now.getHours() - 1, 0)).padStart(2, '0');
    const activeEndHour = String(Math.min(now.getHours() + 1, 23)).padStart(2, '0');
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const futureDay = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

    axios.get.mockImplementation((url) => {
      if (url.includes('/api/bookings/history')) {
        return Promise.resolve({
          data: [
            {
              id: 101,
              status: 'confirmed',
              booking_date: today,
              start_time: `${activeStartHour}:00:00`,
              end_time: `${activeEndHour}:59:00`,
              createdAt: '2026-06-04T00:52:00',
              amount_paid: 5498,
              payment_type: 'full',
              field: { name: 'Quận Trường' },
            },
            {
              id: 102,
              status: 'confirmed',
              booking_date: futureDay,
              start_time: '17:00:00',
              end_time: '18:00:00',
              createdAt: '2026-06-04T00:52:00',
              amount_paid: 399000,
              payment_type: 'full',
              field: { name: 'Lâm Viên' },
            },
          ],
        });
      }

      if (url.includes('/api/complaints/my')) {
        return Promise.resolve({ data: { data: [] } });
      }

      return Promise.resolve({ data: [] });
    });
  });

  it('shows extra food ordering links for bookings that are before or during play', async () => {
    render(
      <MemoryRouter>
        <BookingHistory />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /lịch sử đặt sân/i })).toBeInTheDocument();
    const orderLinks = screen.getAllByRole('link', { name: /đặt thêm món/i });
    expect(orderLinks).toHaveLength(2);
    expect(orderLinks[0]).toHaveAttribute('href', '/history/101');
    expect(orderLinks[1]).toHaveAttribute('href', '/history/102');
  });
});

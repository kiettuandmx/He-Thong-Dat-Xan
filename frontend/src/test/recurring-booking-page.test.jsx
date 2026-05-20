import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RecurringBookingPage from '../pages/RecurringBookingPage';

vi.mock('../services/recurringBookingService', () => ({
  previewRecurringBooking: vi.fn().mockResolvedValue({
    data: {
      data: {
        hasConflicts: false,
        totalEstimatedAmount: 1000000,
        depositAmount: 500000,
        occurrenceCount: 4,
      },
    },
  }),
  createRecurringBooking: vi.fn().mockResolvedValue({
    data: {
      data: {
        id: 77,
        approval_status: 'approved',
      },
    },
  }),
  getMyRecurringBookings: vi.fn().mockResolvedValue({
    data: {
      data: [],
    },
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { user: { id: 7, role_id: 1 } },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      state: {
        field: {
          id: 3,
          name: 'San trung tam',
          price_per_hour: 250000,
        },
      },
    }),
    useNavigate: () => vi.fn(),
  };
});

describe('Trang dat san dinh ky', () => {
  it('renders recurring booking form and summary actions in Vietnamese', async () => {
    render(
      <MemoryRouter>
        <RecurringBookingPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /dat san dinh ky/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/hinh thuc lap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tien coc/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xem truoc chuoi dat/i })).toBeInTheDocument();
  });
});

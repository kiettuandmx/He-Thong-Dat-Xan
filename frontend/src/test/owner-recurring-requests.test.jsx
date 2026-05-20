import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OwnerRecurringRequests from '../pages/OwnerRecurringRequests';

vi.mock('../services/recurringBookingService', () => ({
  getOwnerRecurringBookings: vi.fn().mockResolvedValue({
    data: {
      data: [
        {
          id: 55,
          approval_status: 'pending_owner_review',
          deposit_amount: 300000,
          total_estimated_amount: 1000000,
          user: { name: 'Nguyen Van A' },
          field: { name: 'San 7 nguoi' },
          items: [{ id: 1, scheduled_date: '2026-05-24', item_status: 'pending' }],
        },
      ],
    },
  }),
  approveRecurringBooking: vi.fn().mockResolvedValue({ data: { success: true } }),
  rejectRecurringBooking: vi.fn().mockResolvedValue({ data: { success: true } }),
}));

describe('Trang duyet chuoi dat san cua owner', () => {
  it('renders pending recurring requests with approve and reject actions', async () => {
    render(
      <MemoryRouter>
        <OwnerRecurringRequests />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /yeu cau dat san dinh ky/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/nguyen van a/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /duyet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tu choi/i })).toBeInTheDocument();
  });
});

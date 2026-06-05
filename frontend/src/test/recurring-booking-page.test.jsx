import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RecurringBookingPage from '../pages/RecurringBookingPage';

const { previewRecurringBookingMock } = vi.hoisted(() => ({
  previewRecurringBookingMock: vi.fn(),
}));

previewRecurringBookingMock.mockResolvedValue({
  data: {
    data: {
      hasConflicts: false,
      totalEstimatedAmount: 1000000,
      depositAmount: 500000,
      occurrenceCount: 4,
      occurrences: [
        {
          sequenceNumber: 1,
          scheduledDate: '2026-06-03',
          startTime: '18:00',
          endTime: '19:00',
          isException: false,
          isSkipped: false,
        },
      ],
    },
  },
});

vi.mock('../services/recurringBookingService', () => ({
  previewRecurringBooking: previewRecurringBookingMock,
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

    expect(await screen.findByRole('heading', { name: /đặt sân định kỳ/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/hình thức lặp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tiền cọc/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xem trước chuỗi đặt/i })).toBeInTheDocument();
  });

  it('renders weekday and repeat interval inputs for weekly recurring', async () => {
    render(
      <MemoryRouter>
        <RecurringBookingPage />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText(/thứ trong tuần/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lặp lại mỗi.*tuần/i)).toBeInTheDocument();
  });

  it('sends weekday and repeat interval in preview payload', async () => {
    render(
      <MemoryRouter>
        <RecurringBookingPage />
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByLabelText(/thứ trong tuần/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText(/lặp lại mỗi.*tuần/i), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /xem trước chuỗi đặt/i }));

    await waitFor(() => expect(previewRecurringBookingMock).toHaveBeenCalled());
    expect(previewRecurringBookingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        weekday: 3,
        repeat_interval_weeks: 2,
      })
    );
  });

  it('emits occurrence override payload from the review rows', async () => {
    render(
      <MemoryRouter>
        <RecurringBookingPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /xem trước chuỗi đặt/i }));

    expect(await screen.findByDisplayValue('2026-06-03')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/ngày cho buổi 1/i), {
      target: { value: '2026-06-04' },
    });

    fireEvent.click(screen.getByRole('button', { name: /xem trước chuỗi đặt/i }));

    await waitFor(() =>
      expect(previewRecurringBookingMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          occurrence_overrides: [
            expect.objectContaining({
              sequence_number: 1,
              scheduled_date: '2026-06-04',
            }),
          ],
        })
      )
    );
  });
});

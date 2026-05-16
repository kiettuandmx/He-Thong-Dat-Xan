import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OwnerDashboard from '../pages/OwnerDashboard';

vi.mock('axios', () => ({
  default: {
    get: vi
      .fn()
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: {
          todayBookings: 4,
          monthlyRevenue: 3200000,
          fieldUsage: [],
          peakTimes: [],
          summary: {
            topField: 'Sân A',
            peakHour: '18:00 - 19:00',
          },
        },
      }),
  },
}));

describe('OwnerDashboard', () => {
  it('renders owner dashboard headline and KPI labels in Vietnamese', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ user: { id: 12, role_id: 2, name: 'Chủ sân A' }, token: 'demo-token' })
    );

    const { container } = render(
      <MemoryRouter>
        <OwnerDashboard />
      </MemoryRouter>
    );

    expect((await screen.findAllByText(/doanh thu tháng này/i)).length).toBeGreaterThan(0);
    expect(container.textContent).toMatch(/doanh thu tháng này/i);
    expect(container.textContent).toMatch(/đơn hôm nay/i);
  });
});

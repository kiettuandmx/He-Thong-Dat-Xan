import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PaymentHistory from '../pages/PaymentHistory';

vi.mock('../services/paymentHistoryService', () => ({
  buildCurrentMonthDefaultFilter: () => ({
    month: '05',
    year: '2026',
    page: 1,
    limit: 10,
  }),
  getOwnerPaymentHistory: vi.fn().mockResolvedValue({
    transactions: [],
    summary: { totalPayment: 0, totalRefund: 0, netRevenue: 0 },
    hasMore: false,
  }),
  getUserPaymentHistory: vi.fn(),
}));

describe('PaymentHistory owner mode', () => {
  it('renders owner payment heading in Vietnamese', async () => {
    localStorage.setItem('user', JSON.stringify({ user: { role_id: 2 }, token: 'demo-token' }));

    render(<PaymentHistory />);

    expect(
      await screen.findByRole('heading', { name: /lịch sử thanh toán chủ sân/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/tổng thanh toán/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/tổng hoàn tiền/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/doanh thu thực nhận/i).length).toBeGreaterThan(0);
  });
});

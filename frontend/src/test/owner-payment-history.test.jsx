import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PaymentHistory from '../pages/PaymentHistory';
import * as paymentHistoryService from '../services/paymentHistoryService';

vi.mock('../services/paymentHistoryService', () => ({
  buildCurrentMonthDefaultFilter: () => ({
    month: '05',
    year: '2026',
    page: 1,
    limit: 10,
  }),
  getOwnerPaymentHistory: vi.fn().mockResolvedValue({
    transactions: [
      {
        type: 'payment',
        amount: 2000,
        transactionDate: '2026-06-05T07:14:33.000Z',
        stadiumName: 'Quận 3',
        fieldName: 'Quần Trường',
        status: 'paid',
        userName: 'Test User',
        userPhone: '0909',
      },
      {
        type: 'refund',
        amount: 500,
        transactionDate: '2026-06-05T07:14:34.000Z',
        stadiumName: 'Quận 3',
        fieldName: 'Quần Trường',
        status: 'refunded',
        userName: 'Test User',
        userPhone: '0909',
      },
    ],
    summary: { totalPayment: 0, totalRefund: 0, netRevenue: 0 },
    hasMore: false,
  }),
  getUserPaymentHistory: vi.fn().mockResolvedValue({
    transactions: [
      {
        type: 'payment',
        amount: 2000,
        transactionDate: '2026-06-05T07:14:33.000Z',
        stadiumName: 'Quận 3',
        fieldName: 'Quần Trường',
        status: 'paid',
      },
      {
        type: 'refund',
        amount: 500,
        transactionDate: '2026-06-05T07:14:34.000Z',
        stadiumName: 'Quận 3',
        fieldName: 'Quần Trường',
        status: 'refunded',
      },
    ],
    summary: { totalPayment: 0, totalRefund: 0, netRevenue: 0 },
    hasMore: false,
  }),
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
    expect(screen.getByText('+2.000đ')).toBeInTheDocument();
    expect(screen.getByText('-500đ')).toBeInTheDocument();
  });

  it('reverses payment direction correctly for user history', async () => {
    localStorage.setItem('user', JSON.stringify({ user: { role_id: 1 }, token: 'demo-token' }));

    render(<PaymentHistory />);

    expect(await screen.findByRole('heading', { name: /lịch sử thanh toán/i })).toBeInTheDocument();
    expect(paymentHistoryService.getUserPaymentHistory).toHaveBeenCalled();
    expect(screen.getByText('-2.000đ')).toBeInTheDocument();
    expect(screen.getByText('+500đ')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import WalletPage from '../pages/WalletPage';

vi.mock('../services/walletService', () => ({
  getWalletSummary: vi.fn().mockResolvedValue({
    data: {
      data: {
        balance: 150000,
        transactions: [
          {
            id: 1,
            type: 'TOP_UP',
            amount: 50000,
            description: 'Nap tien vao vi qua vnpay',
            createdAt: '2026-05-19T10:00:00.000Z',
          },
        ],
      },
    },
  }),
  topUpWallet: vi.fn(),
  withdrawWallet: vi.fn(),
}));

describe('Ví tiền người dùng', () => {
  it('renders balance, top-up, withdrawal, and transaction history in Vietnamese', async () => {
    render(
      <MemoryRouter>
        <WalletPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /ví tiền của tôi/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /nạp tiền/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /rút tiền/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^nạp tiền$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^rút tiền$/i })).toBeInTheDocument();
    expect(screen.getByText(/lịch sử giao dịch/i)).toBeInTheDocument();
  });
});

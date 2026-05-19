import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FieldDetail from '../pages/FieldDetail';

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        name: 'Sân Bảy Phúc',
        type: 'football',
        price_per_hour: 250000,
        stadium_id: 7,
        stadium: {
          name: 'Cụm sân Phúc Thịnh',
          location: {
            address: 'Quận 7',
            district: 'TP. Hồ Chí Minh',
          },
        },
        images: [{ image_url: 'https://example.com/field.jpg' }],
        reviews: [],
        schedules: [],
        bookings: [],
      },
    }),
    post: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { user: { id: 7, role_id: 1 } },
  }),
}));

vi.mock('../services/walletService', () => ({
  getWalletSummary: vi.fn().mockResolvedValue({
    data: {
      data: {
        balance: 150000,
      },
    },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/field/1' }),
  };
});

describe('Trang chi tiết sân', () => {
  it('hiển thị khối thông tin sân và khu vực đặt lịch bằng tiếng Việt', async () => {
    render(
      <MemoryRouter>
        <FieldDetail />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /sân bảy phúc/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /lịch đặt sân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xác nhận đặt sân/i })).toBeInTheDocument();
  });

  it('shows wallet beside VNPay and MoMo in the booking payment section', async () => {
    render(
      <MemoryRouter>
        <FieldDetail />
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: /vnpay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /momo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ví/i })).toBeInTheDocument();
  });
});

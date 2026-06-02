import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import PaymentPage from '../pages/PaymentPage';
import Swal from 'sweetalert2';

vi.mock('axios');
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: false })),
  },
}));

describe('PaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      'user',
      JSON.stringify({
        token: 'demo-token',
        user: { id: 7, role_id: 1 },
      })
    );
  });

  it('shows the payment reference and automatic verification guidance for transfer bookings', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 88,
          status: 'pending',
          payment_status: 'unpaid',
          payment_type: 'deposit',
          amount_paid: 200000,
          payment_reference: 'BK88',
          hold_until: null,
          field_id: 3,
          field: {
            name: 'Sân Bóng Đá 6A',
            stadium: {
              owner: {
                name: 'Chủ sân A',
                bank_name: 'MB',
                bank_account: '0123456789',
                phone: '0909000999',
              },
            },
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/payment/88']}>
        <Routes>
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /quét mã thanh toán/i })).toBeInTheDocument();
    expect(screen.getByText(/BK88/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/hệ thống sẽ tự động xác nhận sau khi ngân hàng ghi nhận đúng giao dịch/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /tôi đã chuyển khoản thành công/i })).not.toBeInTheDocument();
  });

  it('shows success state automatically when booking becomes confirmed after polling', async () => {
    Swal.fire.mockResolvedValueOnce({ isConfirmed: true });

    axios.get
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 99,
            status: 'pending',
            payment_status: 'unpaid',
            payment_type: 'full',
            amount_paid: 400000,
            payment_reference: 'BK99',
            hold_until: null,
            field_id: 4,
            field: {
              name: 'Sân A',
              stadium: {
                owner: { name: 'Owner', bank_name: 'MB', bank_account: '1', phone: '0' },
              },
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 99,
            status: 'confirmed',
            payment_status: 'paid',
            payment_type: 'full',
            amount_paid: 400000,
            payment_reference: 'BK99',
            hold_until: null,
            field_id: 4,
            field: {
              name: 'Sân A',
              stadium: {
                owner: { name: 'Owner', bank_name: 'MB', bank_account: '1', phone: '0' },
              },
            },
          },
        },
      });

    const intervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation((callback) => {
      Promise.resolve().then(() => callback());
      return 1;
    });
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={['/payment/99']}>
        <Routes>
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/history" element={<div>Lịch sử đặt sân</div>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText(/BK99/i);
    await waitFor(() => {
      expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/hệ thống đã xác nhận thanh toán thành công/i).length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Thanh toán thành công',
          icon: 'success',
          confirmButtonText: 'OK',
        })
      );
    });

    expect(await screen.findByText(/lịch sử đặt sân/i)).toBeInTheDocument();

    intervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('does not render a fallback QR code when the owner bank account is missing', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: {
          id: 100,
          status: 'pending',
          payment_status: 'unpaid',
          payment_type: 'deposit',
          amount_paid: 150000,
          payment_reference: 'BK100',
          hold_until: null,
          field_id: 5,
          field: {
            name: 'Sân B',
            stadium: {
              owner: {
                name: 'Owner B',
                bank_name: '',
                bank_account: '',
                phone: '0909',
              },
            },
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/payment/100']}>
        <Routes>
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/chủ sân này chưa cập nhật thông tin tài khoản nhận tiền/i)).toBeInTheDocument();
    expect(screen.queryByAltText(/qr code/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/chưa cấu hình/i).length).toBeGreaterThan(0);
  });
});

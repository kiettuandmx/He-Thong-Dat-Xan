import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import ProfilePage from '../pages/ProfilePage';

const mockUpdateUser = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('axios', () => ({
  default: {
    put: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.alert = vi.fn();

    const authPayload = {
      token: 'test-token',
      user: {
        id: 7,
        name: 'Tran Van A',
        email: 'tranvana@example.com',
        phone: '0900000000',
        bank_name: 'MB',
        bank_account: '0123456789',
      },
    };

    localStorage.setItem('user', JSON.stringify(authPayload));
    mockUseAuth.mockReturnValue({
      user: authPayload,
      updateUser: mockUpdateUser,
    });
  });

  it('sends bearer token and updates auth state after saving profile', async () => {
    axios.put.mockResolvedValue({
      data: {
        user: {
          id: 7,
          name: 'Tran Van B',
          email: 'tranvana@example.com',
          phone: '0911222333',
          bank_name: 'VCB',
          bank_account: '9988776655',
          role: 3,
        },
      },
    });

    render(<ProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: /chỉnh sửa thông tin/i }));
    fireEvent.change(screen.getByLabelText(/họ và tên/i), {
      target: { value: 'Tran Van B' },
    });
    fireEvent.change(screen.getByLabelText(/số điện thoại/i), {
      target: { value: '0911222333' },
    });
    fireEvent.change(screen.getByLabelText(/tên ngân hàng/i), {
      target: { value: 'VCB' },
    });
    fireEvent.change(screen.getByLabelText(/số tài khoản nhận tiền/i), {
      target: { value: '9988776655' },
    });
    fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/users/profile/7',
        {
          full_name: 'Tran Van B',
          phone: '0911222333',
          bank_name: 'VCB',
          bank_account: '9988776655',
        },
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      user: {
        id: 7,
        name: 'Tran Van B',
        email: 'tranvana@example.com',
        phone: '0911222333',
        bank_name: 'VCB',
        bank_account: '9988776655',
        role: 3,
      },
    });
    expect(window.alert).toHaveBeenCalled();
  });
});

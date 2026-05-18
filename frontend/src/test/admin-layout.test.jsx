import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminLayout from '../pages/AdminLayout';

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div>Admin content</div>,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AdminLayout', () => {
  it('shows grouped admin navigation in Vietnamese', () => {
    mockUseAuth.mockReturnValue({
      user: { user: { full_name: 'Nguyen Admin' } },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AdminLayout />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /tổng quan/i }));

    expect(screen.getByText(/quản trị/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /quản lý tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /xử lý khiếu nại/i })).toBeInTheDocument();
  });

  it('opens the account drawer with Vietnamese account actions', () => {
    mockUseAuth.mockReturnValue({
      user: { user: { full_name: 'Nguyen Admin' } },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AdminLayout />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /nguyen admin/i }));

    expect(screen.getByText(/hoạt động cá nhân/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /hồ sơ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng xuất/i })).toBeInTheDocument();
  });
});

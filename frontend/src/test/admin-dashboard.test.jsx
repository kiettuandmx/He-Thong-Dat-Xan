import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminDashboard from '../pages/AdminDashboard';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        totalUsers: 12,
        totalStadiums: 5,
        totalFields: 18,
        pendingFields: 3,
      },
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

describe('AdminDashboard', () => {
  it('renders the dashboard hero, KPI cards and quick actions in Vietnamese', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /bạn điều phối trung tâm/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/tài khoản/i)).toBeInTheDocument();
    expect(screen.getByText(/chờ duyệt/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /quản lý tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /xử lý khiếu nại/i })).toBeInTheDocument();
  });

  it('keeps the system broadcast form as a secondary admin tool', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /phát thông báo đến toàn bộ người dùng/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nội dung thông báo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /phát thông báo ngay/i })).toBeInTheDocument();
  });
});

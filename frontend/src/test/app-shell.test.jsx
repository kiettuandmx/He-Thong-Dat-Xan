import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MainLayout from '../components/MainLayout';

const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Khung ứng dụng', () => {
  it('hiển thị lối tắt owner khi tài khoản là chủ sân', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /trang chủ/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bóng đá/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cầu lông/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pickleball/i })).toBeInTheDocument();
  });

  it('hiển thị điều hướng chính bằng tiếng Việt', () => {
    mockUseAuth.mockReturnValue({
      user: {
        user: { name: 'Chủ sân A', role_id: 2 },
      },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /khu vực chủ sân/i })).toBeInTheDocument();
  });

  it('khai báo một font toàn cục cho giao diện', () => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-family-base')
      .trim();

    expect(value).toContain('Be Vietnam Pro');
  });
});

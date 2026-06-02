import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationComponent from '../components/NotificationComponent';

const mockNavigate = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockDisconnect = vi.fn();
const mockEmit = vi.fn();

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: mockOn,
    off: mockOff,
    disconnect: mockDisconnect,
    emit: mockEmit,
  })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotificationComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      'user',
      JSON.stringify({
        token: 'notification-token',
        user: { id: 3, role: 3, name: 'Admin' },
      })
    );
  });

  it('shows loading state before notifications finish loading', async () => {
    global.fetch = vi.fn(
      () =>
        new Promise(() => {
          // keep pending to assert loading UI
        })
    );

    render(
      <MemoryRouter>
        <NotificationComponent />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/🔔/i));

    expect(screen.getByText(/đang tải thông báo/i)).toBeInTheDocument();
  });
});

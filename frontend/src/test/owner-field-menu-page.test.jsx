import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OwnerFieldMenuPage from '../pages/OwnerFieldMenuPage';

vi.mock('../services/menuService', () => ({
  getStadiumMenu: vi.fn().mockResolvedValue({
    data: { data: [{ id: 1, name: 'Pepsi', price: 15000, is_available: true }] },
  }),
  createStadiumMenuItem: vi.fn().mockResolvedValue({ data: { success: true } }),
  updateMenuItem: vi.fn().mockResolvedValue({ data: { success: true } }),
  updateMenuItemAvailability: vi.fn().mockResolvedValue({ data: { success: true } }),
  deleteMenuItem: vi.fn().mockResolvedValue({ data: { success: true } }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ stadiumId: '21' }),
  };
});

describe('OwnerFieldMenuPage', () => {
  it('renders owner field menu items and create button', async () => {
    render(
      <MemoryRouter>
        <OwnerFieldMenuPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /menu chung của khu sân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thêm món/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sửa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xóa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đánh dấu hết món/i })).toBeInTheDocument();
  });
});

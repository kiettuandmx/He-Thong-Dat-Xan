import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OwnerFieldMenuPage from '../pages/OwnerFieldMenuPage';

vi.mock('../services/menuService', () => ({
  getFieldMenu: vi.fn().mockResolvedValue({
    data: { data: [{ id: 1, name: 'Pepsi', price: 15000 }] },
  }),
  createFieldMenuItem: vi.fn().mockResolvedValue({ data: { success: true } }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ fieldId: '3' }),
  };
});

describe('OwnerFieldMenuPage', () => {
  it('renders owner field menu items and create button', async () => {
    render(
      <MemoryRouter>
        <OwnerFieldMenuPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /menu sân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thêm món/i })).toBeInTheDocument();
  });
});

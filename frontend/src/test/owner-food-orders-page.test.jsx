import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OwnerFoodOrdersPage from '../pages/OwnerFoodOrdersPage';

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          foodOrders: [{ id: 10, status: 'pending' }],
        },
      ],
    }),
  },
}));

vi.mock('../services/foodOrderService', () => ({
  updateFoodOrderStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ fieldId: '3' }),
  };
});

describe('OwnerFoodOrdersPage', () => {
  it('renders owner food orders and status buttons', async () => {
    render(
      <MemoryRouter>
        <OwnerFoodOrdersPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /đơn món theo sân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đang chuẩn bị/i })).toBeInTheDocument();
  });
});

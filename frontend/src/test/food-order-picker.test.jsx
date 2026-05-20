import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FoodOrderPicker from '../components/FoodOrderPicker';

describe('FoodOrderPicker', () => {
  it('lets the user add and remove menu quantities and shows subtotal', () => {
    const onIncrease = vi.fn();
    const onDecrease = vi.fn();

    render(
      <FoodOrderPicker
        items={[{ id: 1, name: 'Pepsi', price: 15000, is_available: true }]}
        onDecrease={onDecrease}
        onIncrease={onIncrease}
        selections={{ 1: 1 }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /tăng pepsi/i }));
    fireEvent.click(screen.getByRole('button', { name: /giảm pepsi/i }));

    expect(screen.getAllByText(/15\.000đ/i).length).toBeGreaterThan(0);
    expect(onIncrease).toHaveBeenCalledWith(1);
    expect(onDecrease).toHaveBeenCalledWith(1);
  });
});

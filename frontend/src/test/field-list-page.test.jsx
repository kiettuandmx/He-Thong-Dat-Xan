import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FieldListPage from '../pages/FieldListPage';

const filterSidebarPropsHistory = [];
const renderedFieldCards = [];

vi.mock('../components/FilterSidebar', () => ({
  default: (props) => {
    filterSidebarPropsHistory.push(props);

    return (
      <aside>
        <button type="button" onClick={() => props.onResults([{ id: 1 }])}>
          Cập nhật kết quả
        </button>
        <button
          type="button"
          onClick={() =>
            props.onResults([
              {
                id: 2,
                name: 'Sân Quận Trường',
                type: 'football',
                price_per_hour: 399000,
                images: [],
                stadium: {
                  name: 'Cụm sân Quận Trường',
                  location: {
                    address: '23 Thành Thái',
                    district: null,
                  },
                },
              },
            ])
          }
        >
          Cập nhật địa chỉ null
        </button>
      </aside>
    );
  },
}));

vi.mock('../components/FieldCard', () => ({
  default: (props) => {
    renderedFieldCards.push(props);
    return <article>{props.field.address}</article>;
  },
}));

describe('Trang danh sách sân', () => {
  it('hiển thị hero khám phá bằng tiếng Việt', () => {
    filterSidebarPropsHistory.length = 0;
    renderedFieldCards.length = 0;

    render(
      <MemoryRouter>
        <FieldListPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/đặt sân theo phong cách thể thao hiện đại/i)).toBeInTheDocument();
    expect(screen.getByText(/khám phá sân phù hợp quanh bạn/i)).toBeInTheDocument();
  });

  it('giữ ổn định callback truyền xuống bộ lọc sau khi trang re-render', () => {
    filterSidebarPropsHistory.length = 0;
    renderedFieldCards.length = 0;

    render(
      <MemoryRouter>
        <FieldListPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /cập nhật kết quả/i }));

    expect(filterSidebarPropsHistory.length).toBeGreaterThan(1);
    expect(filterSidebarPropsHistory[0].onResults).toBe(filterSidebarPropsHistory[1].onResults);
    expect(filterSidebarPropsHistory[0].onLoadingChange).toBe(
      filterSidebarPropsHistory[1].onLoadingChange
    );
  });

  it('không hiển thị chữ null trong địa chỉ sân khi quận bị thiếu', () => {
    filterSidebarPropsHistory.length = 0;
    renderedFieldCards.length = 0;

    render(
      <MemoryRouter>
        <FieldListPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /cập nhật địa chỉ null/i }));

    expect(renderedFieldCards.at(-1)?.field.address).toBe('23 Thành Thái');
    expect(screen.getByText('23 Thành Thái')).toBeInTheDocument();
    expect(screen.queryByText('23 Thành Thái, null')).not.toBeInTheDocument();
  });
});

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';

const DEFAULT_FILTERS = {
  keyword: '',
  type: '',
  minPrice: 0,
  maxPrice: 500000,
  minRating: 0,
  sortBy: '',
  userLat: null,
  userLng: null,
};

const FilterSidebar = ({ defaultKeyword = '', onLoadingChange, onResults }) => {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    keyword: defaultKeyword,
  });

  useEffect(() => {
    const fetchFilteredFields = async () => {
      onLoadingChange?.(true);

      try {
        const params = {};
        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.type) params.type = filters.type;
        if (filters.minPrice > 0) params.minPrice = filters.minPrice;
        if (filters.maxPrice < 500000) params.maxPrice = filters.maxPrice;
        if (filters.minRating > 0) params.minRating = filters.minRating;
        if (filters.sortBy) params.sortBy = filters.sortBy;
        if (filters.userLat) params.userLat = filters.userLat;
        if (filters.userLng) params.userLng = filters.userLng;

        const response = await axios.get('http://localhost:5000/api/fields/search', {
          params,
        });

        onResults(response.data);
      } catch (error) {
        console.error('Lỗi khi lọc danh sách sân:', error);
        onResults([]);
      } finally {
        onLoadingChange?.(false);
      }
    };

    const debounceId = window.setTimeout(fetchFilteredFields, 350);
    return () => window.clearTimeout(debounceId);
  }, [filters, onLoadingChange, onResults]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingSelect = (rating) => {
    setFilters((prev) => ({
      ...prev,
      minRating: prev.minRating === rating ? 0 : rating,
    }));
  };

  const handleSortChange = (event) => {
    const value = event.target.value;

    if (value !== 'gan_nhat') {
      setFilters((prev) => ({
        ...prev,
        sortBy: value,
        userLat: null,
        userLng: null,
      }));
      return;
    }

    if (!navigator.geolocation) {
      window.alert('Trình duyệt của bạn không hỗ trợ định vị vị trí.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters((prev) => ({
          ...prev,
          sortBy: value,
          userLat: position.coords.latitude,
          userLng: position.coords.longitude,
        }));
      },
      () => {
        window.alert('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
        setFilters((prev) => ({ ...prev, sortBy: '' }));
      }
    );
  };

  const clearFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      keyword: defaultKeyword,
    });
  };

  return (
    <aside className="filter-panel">
      <div className="filter-panel__header">
        <div>
          <h2>Bộ lọc tìm sân</h2>
          <p className="mb-0 text-muted">Thu gọn lựa chọn để thấy đúng sân bạn cần.</p>
        </div>
        <button type="button" className="filter-reset" onClick={clearFilters}>
          Xóa bộ lọc
        </button>
      </div>

      <div className="filter-stack">
        <div className="filter-group">
          <label className="filter-label" htmlFor="sortBy">
            Sắp xếp theo
          </label>
          <select
            id="sortBy"
            className="filter-select"
            name="sortBy"
            onChange={handleSortChange}
            value={filters.sortBy}
          >
            <option value="">Mặc định</option>
            <option value="gia_tang">Giá tăng dần</option>
            <option value="gia_giam">Giá giảm dần</option>
            <option value="danh_gia">Đánh giá cao nhất</option>
            <option value="gan_nhat">Gần tôi nhất</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="keyword">
            Từ khóa hoặc khu vực
          </label>
          <input
            id="keyword"
            className="filter-input"
            name="keyword"
            onChange={handleChange}
            placeholder="Ví dụ: Quận 7, sân cỏ nhân tạo"
            type="text"
            value={filters.keyword}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="type">
            Môn thể thao
          </label>
          <select
            id="type"
            className="filter-select"
            name="type"
            onChange={handleChange}
            value={filters.type}
          >
            <option value="">Tất cả môn thể thao</option>
            {FIELD_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <label className="filter-label mb-0" htmlFor="maxPrice">
              Mức giá tối đa
            </label>
            <span className="filter-range-value">
              {Number(filters.maxPrice).toLocaleString('vi-VN')}đ/giờ
            </span>
          </div>
          <input
            id="maxPrice"
            className="form-range"
            max="500000"
            min="0"
            name="maxPrice"
            onChange={handleChange}
            step="50000"
            type="range"
            value={filters.maxPrice}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Đánh giá tối thiểu</span>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`rating-star-button ${filters.minRating >= star ? 'is-active' : ''}`}
                onClick={() => handleRatingSelect(star)}
              >
                <i className="bi bi-star-fill"></i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

FilterSidebar.propTypes = {
  defaultKeyword: PropTypes.string,
  onLoadingChange: PropTypes.func,
  onResults: PropTypes.func.isRequired,
};

export default FilterSidebar;

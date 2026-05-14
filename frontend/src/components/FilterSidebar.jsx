import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';

const FilterSidebar = ({ onResults }) => {
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    minPrice: 0,
    maxPrice: 500000,
    minRating: 0,
    sortBy: '',
    userLat: null,
    userLng: null,
  });

  useEffect(() => {
    const fetchFilteredFields = async () => {
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
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchFilteredFields();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters, onResults]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingSelect = (rating) => {
    setFilters((prev) => ({ ...prev, minRating: rating }));
  };

  const handleSortChange = (event) => {
    const value = event.target.value;
    if (value === 'gan_nhat') {
      if (navigator.geolocation) {
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
            alert(
              'Không thể lấy được vị trí của bạn. Vui lòng kiểm tra quyền truy cập vị trí.'
            );
            setFilters((prev) => ({ ...prev, sortBy: '' }));
          }
        );
      } else {
        alert('Trình duyệt của bạn không hỗ trợ Geolocation.');
        setFilters((prev) => ({ ...prev, sortBy: '' }));
      }
    } else {
      setFilters((prev) => ({
        ...prev,
        sortBy: value,
        userLat: null,
        userLng: null,
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      type: '',
      minPrice: 0,
      maxPrice: 500000,
      minRating: 0,
      sortBy: '',
      userLat: null,
      userLng: null,
    });
  };

  return (
    <div className="p-4 bg-white border rounded-4 shadow-sm h-100">
      <h4 className="fw-bold mb-4 text-dark">
        <i className="bi bi-funnel-fill text-success me-2"></i> Lọc Tìm Kiếm
      </h4>

      <div className="mb-4">
        <label className="form-label fw-semibold text-secondary">Sắp xếp theo</label>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleSortChange}
          className="form-select border-success"
        >
          <option value="">Mặc định (Mới nhất)</option>
          <option value="gia_tang">Giá tăng dần</option>
          <option value="gia_giam">Giá giảm dần</option>
          <option value="danh_gia">Đánh giá cao nhất</option>
          <option value="gan_nhat">Gần tôi nhất</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold text-secondary">Từ khóa / Vị trí</label>
        <div className="input-group">
          <span className="input-group-text bg-white">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            name="keyword"
            value={filters.keyword}
            onChange={handleChange}
            placeholder="Tên sân, Quận..."
            className="form-control"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold text-secondary">Loại sân</label>
        <select
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="form-select"
        >
          <option value="">Tất cả các môn</option>
          {FIELD_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sân {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold text-secondary d-flex justify-content-between">
          <span>Giá tối đa:</span>
          <span className="text-success fw-bold">
            {Number(filters.maxPrice).toLocaleString('vi-VN')} đ/h
          </span>
        </label>
        <input
          type="range"
          name="maxPrice"
          min="0"
          max="500000"
          step="50000"
          value={filters.maxPrice}
          onChange={handleChange}
          className="form-range"
        />
        <div className="d-flex justify-content-between text-muted small">
          <span>0đ</span>
          <span>500k+</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold text-secondary">Đánh giá tối thiểu</label>
        <div className="d-flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              onClick={() => handleRatingSelect(star)}
              className={`bi bi-star-fill fs-4 cursor-pointer ${
                filters.minRating >= star ? 'text-warning' : 'text-light'
              }`}
              style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            ></i>
          ))}
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="btn btn-light w-100 fw-semibold mt-3 text-secondary border"
      >
        <i className="bi bi-arrow-counterclockwise me-2"></i> Xóa bộ lọc
      </button>
    </div>
  );
};

export default FilterSidebar;

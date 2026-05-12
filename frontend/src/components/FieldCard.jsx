import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const FieldCard = ({ field }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('user'));

      const res = await axios.get('http://localhost:5000/api/favorites', {
        headers: {
          Authorization: `Bearer ${authData?.token}`,
        },
      });

      setFavorites(res.data.map((f) => f.field_id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleFavorite = async (e, fieldId) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const authData = JSON.parse(localStorage.getItem('user'));

      if (favorites.includes(fieldId)) {
        // ❌ ĐÃ LIKE → XOÁ
        await axios.delete(`http://localhost:5000/api/favorites/${fieldId}`, {
          headers: {
            Authorization: `Bearer ${authData?.token}`,
          },
        });

        setFavorites((prev) => prev.filter((id) => id !== fieldId));
      } else {
        // ❤️ CHƯA LIKE → THÊM
        await axios.post(
          `http://localhost:5000/api/favorites/${fieldId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${authData?.token}`,
            },
          }
        );

        setFavorites((prev) => [...prev, fieldId]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleCardClick = () => {
    navigate(`/field/${field.id}`);
  };

  // Helper để lấy cấu hình Badge đồng bộ với CSS
  const getBadgeConfig = (type) => {
    const t = type?.toLowerCase();
    if (t === 'football' || t === 'bóng đá')
      return {
        label: 'Bóng đá',
        color: 'badge-football',
        icon: 'bi-patch-check-fill',
      };
    if (t === 'badminton' || t === 'cầu lông')
      return {
        label: 'Cầu lông',
        color: 'badge-badminton',
        icon: 'bi-lightning-fill',
      };
    if (t === 'pickleball')
      return {
        label: 'Pickleball',
        color: 'badge-pickleball',
        icon: 'bi-star-fill',
      };
    return { label: type, color: 'badge-default', icon: 'bi-sport' };
  };

  const badge = getBadgeConfig(field.type);

  return (
    /* Thêm h-100 để card luôn cao bằng nhau trong một hàng */
    <div
      className="field-card h-100 d-flex flex-column shadow-sm"
      onClick={handleCardClick}
    >
      {/* Khung ảnh sân */}
      <div className="card-image-wrapper position-relative">
        <button
          className="favorite-btn position-absolute top-0 start-0 m-2"
          onClick={(e) => handleFavorite(e, field.id)}
        >
          <i
            className={`bi ${
              favorites.includes(field.id)
                ? 'bi-heart-fill text-danger'
                : 'bi-heart'
            }`}
          ></i>
        </button>

        <img
          src={
            field.image || 'https://via.placeholder.com/400x200?text=No+Image'
          }
          className="field-image w-100"
          alt={field.name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
        <span className="status-badge">
          <i className="bi bi-circle-fill me-1"></i> Còn sân
        </span>
      </div>

      {/* Nội dung card - d-flex flex-column và flex-grow-1 để đẩy footer xuống đáy */}
      <div className="card-body-content p-3 d-flex flex-column flex-grow-1">
        <div className="mb-2">
          <span className={`counter ${badge.color}`}>
            <i className={`bi ${badge.icon} me-1`}></i> {badge.label}
          </span>
        </div>

        <h5 className="field-title fw-bold text-dark mb-1">{field.name}</h5>
        <p className="field-location text-muted small text-truncate mb-3">
          <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
          {field.address}
        </p>

        {/* mt-auto giúp phần footer luôn nằm sát đáy card bất kể tên sân dài hay ngắn */}
        <div className="field-footer mt-auto pt-2 border-top">
          <div className="price-tag mb-2">
            <span className="price-amount fs-5 fw-bold text-success">
              {Number(field.price).toLocaleString('vi-VN')}đ
            </span>
            <span className="price-unit small text-muted"> /giờ</span>
          </div>

          <button
            className="btn-book-now w-100 py-2 fw-bold"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            Xem lịch & Đặt sân
          </button>
        </div>
      </div>
    </div>
  );
};

FieldCard.propTypes = {
  field: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
};

export default FieldCard;

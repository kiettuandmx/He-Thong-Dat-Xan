import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getFieldTypeBadgeConfig } from '../constants/fieldTypes';
import { getFieldDetailPath, getStoredAuthData } from '../utils/authHelpers';

const FieldCard = ({ field, detailPath }) => {
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

      setFavorites(res.data.map((favorite) => favorite.field_id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleFavorite = async (event, fieldId) => {
    event.stopPropagation();
    event.preventDefault();

    try {
      const authData = JSON.parse(localStorage.getItem('user'));

      if (favorites.includes(fieldId)) {
        await axios.delete(`http://localhost:5000/api/favorites/${fieldId}`, {
          headers: {
            Authorization: `Bearer ${authData?.token}`,
          },
        });

        setFavorites((prev) => prev.filter((id) => id !== fieldId));
        return;
      }

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
    } catch (err) {
      console.log(err);
    }
  };

  const handleCardClick = () => {
    navigate(detailPath || getFieldDetailPath(field.id, getStoredAuthData()));
  };

  const badge = getFieldTypeBadgeConfig(field.type);

  return (
    <div
      className="field-card h-100 d-flex flex-column shadow-sm"
      onClick={handleCardClick}
    >
      <div className="card-image-wrapper position-relative">
        <button
          className="favorite-btn position-absolute top-0 start-0 m-2"
          onClick={(event) => handleFavorite(event, field.id)}
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
          src={field.image || 'https://via.placeholder.com/400x200?text=No+Image'}
          className="field-image w-100"
          alt={field.name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
        <span className="status-badge">
          <i className="bi bi-circle-fill me-1"></i> Còn sân
        </span>
      </div>

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

        <div className="field-footer mt-auto pt-2 border-top">
          <div className="price-tag mb-2">
            <span className="price-amount fs-5 fw-bold text-success">
              {Number(field.price * 1000).toLocaleString('vi-VN')}đ
            </span>
            <span className="price-unit small text-muted"> /giờ</span>
          </div>

          <button
            className="btn-book-now w-100 py-2 fw-bold"
            onClick={(event) => {
              event.stopPropagation();
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
  detailPath: PropTypes.string,
};

export default FieldCard;

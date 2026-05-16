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
    const fetchFavorites = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem('user') || 'null');
        if (!authData?.token) return;

        const response = await axios.get('http://localhost:5000/api/favorites', {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        });

        setFavorites(response.data.map((favorite) => favorite.field_id));
      } catch (error) {
        console.log(error);
      }
    };

    fetchFavorites();
  }, []);

  const badge = getFieldTypeBadgeConfig(field.type);

  const handleCardClick = () => {
    navigate(detailPath || getFieldDetailPath(field.id, getStoredAuthData()));
  };

  const handleFavorite = async (event, fieldId) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const authData = JSON.parse(localStorage.getItem('user') || 'null');
      if (!authData?.token) {
        navigate('/login');
        return;
      }

      if (favorites.includes(fieldId)) {
        await axios.delete(`http://localhost:5000/api/favorites/${fieldId}`, {
          headers: {
            Authorization: `Bearer ${authData.token}`,
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
            Authorization: `Bearer ${authData.token}`,
          },
        }
      );

      setFavorites((prev) => [...prev, fieldId]);
    } catch (error) {
      console.log(error);
    }
  };

  const isFavorite = favorites.includes(field.id);

  return (
    <article className="field-card" onClick={handleCardClick}>
      <div className="field-card__media">
        <img
          alt={field.name}
          className="field-card__image"
          src={field.image || 'https://via.placeholder.com/400x200?text=San'}
        />
        <button
          type="button"
          className="field-card__favorite"
          onClick={(event) => handleFavorite(event, field.id)}
        >
          <i className={`bi ${isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart'} me-2`}></i>
          {isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
        </button>
        <span className="field-card__status">Còn nhận đặt</span>
      </div>

      <div className="field-card__body">
        <span className={`field-card__badge ${badge.color}`}>
          <i className={`bi ${badge.icon} me-2`}></i>
          {badge.label}
        </span>

        <h3>{field.name}</h3>
        <p className="field-card__location">
          <i className="bi bi-geo-alt me-2 text-danger"></i>
          {field.address}
        </p>

        <div className="field-card__footer">
          <div className="field-card__price">
            <strong>{Number(field.price || 0).toLocaleString('vi-VN')}đ</strong>
            <span>mỗi giờ</span>
          </div>

          <button
            type="button"
            className="field-card__cta"
            onClick={(event) => {
              event.stopPropagation();
              handleCardClick();
            }}
          >
            Xem lịch và đặt sân
          </button>
        </div>
      </div>
    </article>
  );
};

FieldCard.propTypes = {
  field: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    image: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string,
  }).isRequired,
  detailPath: PropTypes.string,
};

export default FieldCard;

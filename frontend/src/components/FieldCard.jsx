import React from 'react';
import PropTypes from 'prop-types';

const FieldCard = ({ field }) => {
  return (
    <div className="card h-100 w-100 shadow-sm border-0 rounded-4 overflow-hidden">
      {/* Khung ảnh sân */}
      <div
        style={{ height: '200px', overflow: 'hidden', position: 'relative' }}
      >
        <img
          src={field.image}
          className="card-img-top w-100 h-100 object-fit-cover"
          alt={field.name}
        />
        <span className="badge bg-success position-absolute top-0 start-0 m-3">
          Còn sân
        </span>
      </div>

      {/* Nội dung card */}
      <div className="card-body d-flex flex-column p-4">
        <h5 className="card-title fw-bold mb-1">{field.name}</h5>
        <p className="text-muted small mb-3">{field.address}</p>

        <div className="mt-auto">
          <p className="h5 text-success fw-bold mb-3">
            {field.price?.toLocaleString()}đ{' '}
            <span className="text-muted small fw-normal">/giờ</span>
          </p>
          <button className="btn btn-success w-100 py-2 rounded-3 fw-bold">
            Đặt sân ngay
          </button>
        </div>
      </div>
    </div>
  );
};

FieldCard.propTypes = {
  field: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
  }).isRequired,
};

export default FieldCard;

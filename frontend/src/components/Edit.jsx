import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Edit = ({ fieldId }) => {
  const navigate = useNavigate();

  return (
    <button
      className="btn btn-light border px-4 py-2 fw-semibold edit-btn w-100"
      onClick={() => navigate(`/admin/edit-field/${fieldId}`)}
    >
      <i className="bi bi-pencil-square me-1 text-primary"></i>
      Chỉnh sửa
    </button>
  );
};

Edit.propTypes = {
  fieldId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default Edit;

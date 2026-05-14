import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const Delete = ({ id, onSuccess }) => {
  const handleDelete = async () => {
    if (window.confirm('Ban co chac chan muon xoa san nay?')) {
      const authData = JSON.parse(localStorage.getItem('user'));
      const token = authData?.token;

      if (!token) {
        alert('Vui long dang nhap de xoa san.');
        return;
      }

      try {
        await axios.delete(`http://localhost:5000/api/fields/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Xoa thanh cong!');

        if (onSuccess) {
          onSuccess(id);
        }
      } catch (err) {
        alert(
          'Loi khi xoa san! ' +
            (err.response?.data?.error || err.response?.data?.message || err.message)
        );
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="btn btn-outline-danger btn-sm rounded-pill"
    >
      <i className="bi bi-trash"></i> Xoa
    </button>
  );
};

Delete.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSuccess: PropTypes.func,
};

export default Delete;

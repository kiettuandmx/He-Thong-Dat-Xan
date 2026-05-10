import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const Delete = ({ id, onSuccess }) => {
  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sân này?')) {
      const authData = JSON.parse(localStorage.getItem('user'));
      const token = authData?.token;
      if (!token) {
        alert('Vui lòng đăng nhập để xóa sân.');
        return;
      }

      try {
        await axios.delete(`http://localhost:5000/api/fields/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Xóa thành công!');
        if (onSuccess) onSuccess(id); // Gọi hàm này để trang cha xóa item khỏi state
      } catch (err) {
        alert(
          'Lỗi khi xóa sân! ' + (err.response?.data?.message || err.message)
        );
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="btn btn-outline-danger btn-sm rounded-pill"
    >
      <i className="bi bi-trash"></i> Xóa
    </button>
  );
};

Delete.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSuccess: PropTypes.func,
};

export default Delete;

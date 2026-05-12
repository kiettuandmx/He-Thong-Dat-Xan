import React from 'react';
import { useNavigate } from 'react-router-dom';

const Add = () => {
  const navigate = useNavigate();

  return (
    <button
      className="btn btn-light border px-4 py-2 fw-semibold add-btn w-100"
      onClick={() => navigate('/admin/add-field')}
    >
      <i className="bi bi-plus-circle me-1 text-primary"></i>
      Thêm sân mới
      <style>{`
        .add-btn{
          transition: all .2s ease;
        }

        /* rê chuột vào là hiện xanh dương */
        .add-btn:hover{
          background:#0d6efd !important;
          color:white !important;
          border-color:#0d6efd !important;
        }

        .add-btn:hover i{
          color:white !important;
        }

        .add-btn:active{
          background:#0b5ed7 !important;
          transform:scale(.97);
        }

        .add-btn:focus{
          box-shadow:none;
        }
      `}</style>
    </button>
  );
};

export default Add;

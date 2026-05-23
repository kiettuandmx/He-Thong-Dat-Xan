import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_id: 1,
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(formData);
      alert('Đăng ký thành công!');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '40px' }}
    >
      <div
        className="card border-0"
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '28px',
          padding: '45px',
          background: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div className="text-center mb-5">
          <div className="mb-3 d-inline-block p-3 rounded-circle" style={{ background: 'var(--accent-green)' }}>
            <i className="bi bi-person-plus-fill fs-3" style={{ color: 'var(--primary)' }}></i>
          </div>
          <h2 className="fw-black" style={{ color: 'var(--text-dark)', letterSpacing: '-1px', fontSize: '2rem' }}>
            Tạo tài khoản<span style={{ color: 'var(--primary)' }}>.</span>
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Bắt đầu trải nghiệm đặt sân chuyên nghiệp cùng S.BOOK
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { icon: 'bi-person', type: 'text', placeholder: 'Họ và tên', field: 'name' },
            { icon: 'bi-envelope', type: 'email', placeholder: 'Email', field: 'email' },
            { icon: 'bi-lock', type: 'password', placeholder: 'Mật khẩu', field: 'password' },
            { icon: 'bi-telephone', type: 'text', placeholder: 'Số điện thoại', field: 'phone' },
          ].map((input, idx) => (
            <div className="mb-3 position-relative" key={idx}>
              <span className="position-absolute" style={{ left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 10 }}>
                <i className={`bi ${input.icon}`}></i>
              </span>
              <input
                type={input.type}
                className="form-control border-0 shadow-none"
                placeholder={input.placeholder}
                style={{
                  borderRadius: '16px',
                  background: '#f1f5f9',
                  padding: '14px 14px 14px 48px',
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  border: '1px solid transparent',
                }}
                onFocus={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(45, 106, 79, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#f1f5f9';
                  e.target.style.borderColor = 'transparent';
                  e.target.style.boxShadow = 'none';
                }}
                onChange={(e) => setFormData({ ...formData, [input.field]: e.target.value })}
                required
              />
            </div>
          ))}

          <div className="mb-4">
            <label className="small fw-bold text-muted mb-2 ms-2">Bạn đăng ký với vai trò:</label>
            <div className="position-relative">
              <span className="position-absolute" style={{ left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 10 }}>
                <i className="bi bi-briefcase"></i>
              </span>
              <select
                className="form-select border-0 shadow-none"
                style={{
                  borderRadius: '16px',
                  background: '#f1f5f9',
                  padding: '14px 14px 14px 48px',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
              >
                <option value={1}>Người đi thuê sân (User)</option>
                <option value={2}>Chủ sân bóng (Owner)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-book-now w-100 py-3 shadow-sm mt-2"
            style={{ borderRadius: '16px', fontSize: '1rem' }}
          >
            ĐĂNG KÝ NGAY
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="small text-muted mb-0">
            Đã có tài khoản?{' '}
            <button
              onClick={() => navigate('/login')}
              className="btn btn-link fw-bold text-decoration-none p-0 ms-1"
              style={{ color: 'var(--primary)', fontSize: '0.9rem' }}
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

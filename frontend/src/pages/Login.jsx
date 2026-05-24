import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const data = await login(email, password);
      authLogin(data);
      alert(`Chào mừng ${data.user.name}!`);

      const role = data.user.role;
      if (role === 3) {
        navigate('/admin/dashboard');
      } else if (role === 2) {
        navigate('/owner/stadiums');
      } else {
        navigate('/');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f7f4 0%, #ffffff 100%)',
        padding: '16px',
      }}
    >
      <div
        className="card border-0 shadow-lg overflow-hidden"
        style={{
          maxWidth: '760px',
          width: '100%',
          borderRadius: '22px',
          background: '#ffffff',
        }}
      >
        <div className="row g-0">
          <div
            className="col-lg-5 d-none d-lg-flex flex-column justify-content-center align-items-center text-white p-4"
            style={{
              background:
                'linear-gradient(rgba(25, 135, 84, 0.8), rgba(20, 92, 50, 0.9)), url("https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <h1
              className="fw-bold mb-3"
              style={{ letterSpacing: '1px', fontSize: '2.25rem' }}
            >
              S.BOOK
            </h1>
            <div
              className="bg-white rounded-pill mb-4"
              style={{ width: '40px', height: '3px' }}
            ></div>
            <p className="text-center opacity-90 mb-0" style={{ fontSize: '1.1rem', lineHeight: 1.55 }}>
              Sẵn sàng ra sân? <br /> Đăng nhập để tiếp tục đam mê.
            </p>
          </div>

          <div className="col-lg-7 p-4 d-flex flex-column justify-content-center">
            <div className="text-center text-lg-start mb-3">
              <h2
                className="fw-bold mb-1"
                style={{ color: '#198754', fontSize: '2.35rem' }}
              >
                ĐĂNG NHẬP
              </h2>
              <p className="text-muted small">
                Chào mừng bạn quay trở lại với hệ thống
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-floating mb-3 shadow-sm rounded-4 overflow-hidden">
                <input
                  type="email"
                  className="form-control border-0 bg-light px-4"
                  id="floatingEmail"
                  placeholder="name@example.com"
                  style={{ height: '50px' }}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="floatingEmail" className="text-muted ps-4">
                  Email của bạn
                </label>
              </div>

              <div className="form-floating mb-3 shadow-sm rounded-4 overflow-hidden">
                <input
                  type="password"
                  className="form-control border-0 bg-light px-4"
                  id="floatingPassword"
                  placeholder="Mật khẩu"
                  style={{ height: '50px' }}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="floatingPassword" className="text-muted ps-4">
                  Mật khẩu
                </label>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                  />
                  <label
                    className="form-check-label small text-muted"
                    htmlFor="rememberMe"
                  >
                    Ghi nhớ tôi
                  </label>
                </div>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none small fw-bold text-success"
                  onClick={() => navigate('/forgot-password')}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-success w-100 fw-bold py-2 shadow-lg transition-all"
                style={{
                  borderRadius: '12px',
                  background:
                    'linear-gradient(135deg, #198754 0%, #145c32 100%)',
                  border: 'none',
                  fontSize: '1rem',
                }}
              >
                ĐĂNG NHẬP
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="small text-muted">Chưa có tài khoản? </span>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-link small fw-bold text-decoration-none p-0"
                style={{ color: '#198754' }}
              >
                Đăng ký ngay tại đây
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

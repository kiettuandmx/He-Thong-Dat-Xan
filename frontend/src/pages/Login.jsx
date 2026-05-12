import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService'; // Named Import chuẩn

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Đang đăng nhập với:', email);

    try {
      // SỬA TẠI ĐÂY: Gọi trực tiếp hàm login đã import ở trên
      const data = await login(email, password);

      // Cập nhật user vào AuthContext
      authLogin(data);

      alert(`Chào mừng ${data.user.name}!`);

      // Điều hướng dựa trên Role (1: User, 2: Owner, 3: Admin)
      const role = data.user.role;
      if (role === 3) {
        navigate('/admin/dashboard');
      } else if (role === 2) {
        navigate('/owner/stadiums'); // Chỉnh lại path cho khớp với App.jsx của bạn
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f7f4 0%, #ffffff 100%)',
        padding: '20px',
      }}
    >
      <div
        className="card border-0 shadow-lg overflow-hidden"
        style={{
          maxWidth: '950px',
          width: '100%',
          borderRadius: '30px',
          background: '#ffffff',
        }}
      >
        <div className="row g-0">
          {/* Cột trái: Hình ảnh & Thương hiệu */}
          <div
            className="col-lg-5 d-none d-lg-flex flex-column justify-content-center align-items-center text-white p-5"
            style={{
              background:
                'linear-gradient(rgba(25, 135, 84, 0.8), rgba(20, 92, 50, 0.9)), url("https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <h1
              className="fw-bold mb-3"
              style={{ letterSpacing: '2px', fontSize: '3rem' }}
            >
              S.BOOK
            </h1>
            <div
              className="bg-white rounded-pill mb-4"
              style={{ width: '50px', height: '4px' }}
            ></div>
            <p className="text-center fs-5 opacity-90">
              Sẵn sàng ra sân? <br /> Đăng nhập để tiếp tục đam mê.
            </p>
          </div>

          {/* Cột phải: Form đăng nhập */}
          <div className="col-lg-7 p-4 p-md-5 d-flex flex-column justify-content-center">
            <div className="text-center text-lg-start mb-4">
              <h2
                className="fw-bold mb-1"
                style={{ color: '#198754' }}
              >
                ĐĂNG NHẬP
              </h2>
              <p className="text-muted small">
                Chào mừng bạn quay trở lại với hệ thống
              </p>
            </div>

            <form onSubmit={handleLogin}>
              {/* Input Email với Floating Label */}
              <div className="form-floating mb-3 shadow-sm rounded-4 overflow-hidden">
                <input
                  type="email"
                  className="form-control border-0 bg-light px-4"
                  id="floatingEmail"
                  placeholder="name@example.com"
                  style={{ height: '60px' }}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="floatingEmail" className="text-muted ps-4">
                  Email của bạn
                </label>
              </div>

              {/* Input Password */}
              <div className="form-floating mb-3 shadow-sm rounded-4 overflow-hidden">
                <input
                  type="password"
                  className="form-control border-0 bg-light px-4"
                  id="floatingPassword"
                  placeholder="Mật khẩu"
                  style={{ height: '60px' }}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="floatingPassword" className="text-muted ps-4">
                  Mật khẩu
                </label>
              </div>

              {/* Quên mật khẩu & Ghi nhớ */}
              <div className="d-flex justify-content-between align-items-center mb-4 px-2">
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
                className="btn btn-success w-100 fw-bold py-3 shadow-lg transition-all"
                style={{
                  borderRadius: '15px',
                  background:
                    'linear-gradient(135deg, #198754 0%, #145c32 100%)',
                  border: 'none',
                  fontSize: '1.1rem',
                }}
              >
                ĐĂNG NHẬP
              </button>
            </form>

            {/* Chân trang chuyển hướng sang Đăng ký */}
            <div className="text-center mt-5">
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

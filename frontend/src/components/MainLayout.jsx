import React, { useState } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  const handleSidebarOpen = () => setSidebarOpen(true);
  const handleSidebarClose = () => setSidebarOpen(false);
  const handleLegalOpen = () => setShowLegalModal(true);
  const handleLegalClose = () => setShowLegalModal(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Hàm kiểm tra link đang hoạt động để highlight
  const isActive = (path) => location.pathname === path;

  // Style cho Link dựa trên trạng thái active
  const getLinkStyle = (path) => ({
    color: isActive(path) ? '#1B4332' : '#64748B', // Xanh đậm : Xám hiện đại
    fontWeight: isActive(path) ? '600' : '500',
    position: 'relative',
    transition: 'all 0.3s ease',
    padding: '0.5rem 1rem',
  });

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main)', // Dùng biến thay vì mã màu cứng
      }}
    >
      {/* NAVBAR */}
      <nav
        className="navbar navbar-expand-lg sticky-top"
        style={{
          zIndex: 1000,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)', // Viền rất nhạt
          padding: '1rem 0',
        }}
      >
        <div className="container-fluid px-lg-5">
          {/* LOGO */}
          <Link
            className="navbar-brand fw-black fs-2"
            to="/"
            style={{
              color: '#1B4332',
              letterSpacing: '-1.5px',
              fontWeight: '800',
            }}
          >
            S.BOOK<span className="text-success">.</span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            {/* MENU CHÍNH */}
            <ul className="navbar-nav ms-lg-4 gap-3">
              <li className="nav-item">
                <Link className="nav-link" style={getLinkStyle('/')} to="/">
                  Trang chủ
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  style={getLinkStyle('/football')}
                  to="/football"
                >
                  Bóng đá
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  style={getLinkStyle('/badminton')}
                  to="/badminton"
                >
                  Cầu lông
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  style={getLinkStyle('/pickleball')}
                  to="/pickleball"
                >
                  Pickleball
                </Link>
              </li>

              {/* KHỐI QUẢN TRỊ CHO CHỦ SÂN (ROLE 2) */}
              {(user?.user?.role_id == 2 || user?.user?.role == 2) && (
                <li className="nav-item d-flex align-items-center gap-1 ms-lg-3 ps-lg-3 border-start">
                  <Link
                    className="nav-link px-2"
                    style={getLinkStyle('/owner/dashboard')}
                    to="/owner/dashboard"
                  >
                    <div className="d-flex align-items-center gap-1">
                      <i
                        className="bi bi-graph-up"
                        style={{ color: '#f59e0b' }}
                      ></i>
                      <span style={{ fontSize: '14px' }}>Thống kê</span>
                    </div>
                  </Link>

                  <Link
                    className="nav-link px-2"
                    style={getLinkStyle('/owner/stadiums')}
                    to="/owner/stadiums"
                  >
                    <div className="d-flex align-items-center gap-1">
                      <i className="bi bi-building text-success"></i>
                      <span style={{ fontSize: '14px' }}>Khu sân</span>
                    </div>
                  </Link>

                  <Link
                    className="nav-link px-2"
                    style={getLinkStyle('/owner/fields')}
                    to="/owner/fields"
                  >
                    <div className="d-flex align-items-center gap-1">
                      <i className="bi bi-grid-3x3-gap text-success"></i>
                      <span style={{ fontSize: '14px' }}>Danh sách sân</span>
                    </div>
                  </Link>

                  <Link
                    className="nav-link px-2"
                    style={getLinkStyle('/history')}
                    to="/history"
                  >
                    <div className="d-flex align-items-center gap-1">
                      <i className="bi bi-calendar-check text-primary"></i>
                      <span style={{ fontSize: '14px' }}>Duyệt đơn</span>
                    </div>
                  </Link>

                  {/* THÊM MỚI: Lịch sử hoàn tiền */}
                  <Link
                    className="nav-link px-2"
                    style={getLinkStyle('/owner/refund-history')}
                    to="/owner/refund-history"
                  >
                    <div className="d-flex align-items-center gap-1">
                      <i className="bi bi-arrow-counterclockwise text-danger"></i>
                      <span style={{ fontSize: '14px' }}>Lịch sử hoàn tiền</span>
                    </div>
                  </Link>
                </li>
              )}
            </ul>

            {/* KHỐI USER / AUTH */}
            <div className="ms-auto d-flex align-items-center gap-3">
              {!user ? (
                <>
                  <button
                    className="btn btn-link text-decoration-none text-dark fw-bold"
                    onClick={() => navigate('/login')}
                  >
                    Đăng nhập
                  </button>
                  <button
                    className="btn btn-success px-4 fw-bold"
                    onClick={() => navigate('/register')}
                    style={{
                      borderRadius: '10px',
                      backgroundColor: '#398362',
                      border: 'none',
                    }}
                  >
                    Đăng ký
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-white border shadow-sm d-flex align-items-center gap-2"
                  type="button"
                  onClick={handleSidebarOpen}
                  style={{ borderRadius: '12px' }}
                >
                  <div
                    className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      fontWeight: 'bold',
                    }}
                  >
                    {user.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="fw-semibold">{user.user.name}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div
          onClick={handleSidebarClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.36)',
            zIndex: 1040,
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '320px',
          maxWidth: '100%',
          padding: '1.5rem',
          backgroundColor: '#ffffff',
          boxShadow: 'rgba(15, 23, 42, 0.18) 0px 28px 90px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(120%)',
          transition: 'transform 0.28s ease',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div>
            <p className="text-success text-uppercase small mb-2">Tài khoản</p>
            <div className="d-flex align-items-center gap-3">
              <div
                className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '46px', height: '46px', fontWeight: 800 }}
              >
                {user?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#1f2937' }}>
                  {user?.user?.name}
                </h5>
                <p className="text-muted small mb-0">Chào mừng bạn trở lại</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-light btn-sm rounded-circle border"
            onClick={handleSidebarClose}
            style={{ width: '36px', height: '36px' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-success fw-semibold mb-3">Hoạt động</p>
          <Link
            to="/profile"
            onClick={handleSidebarClose}
            className="d-flex align-items-center gap-2 rounded-4 p-3 mb-3 text-decoration-none"
            style={{ background: '#f6fdf5', color: '#1f2937' }}
          >
            <i className="bi bi-person-fill fs-5 text-success"></i>
            Hồ sơ
          </Link>
          <Link
            to="/history"
            onClick={handleSidebarClose}
            className="d-flex align-items-center gap-2 rounded-4 p-3 mb-3 text-decoration-none"
            style={{ background: '#f6fdf5', color: '#1f2937' }}
          >
            <i className="bi bi-calendar-check fs-5 text-success"></i>
            Danh sách lịch đã đặt
          </Link>
          <Link
            to="/favorites"
            onClick={handleSidebarClose}
            className="d-flex align-items-center gap-2 rounded-4 p-3 mb-3 text-decoration-none"
            style={{ background: '#f6fdf5', color: '#1f2937' }}
          >
            <i className="bi bi-heart-fill fs-5 text-danger"></i>
            Sân yêu thích
          </Link>
          <Link
            to="/my-reviews"
            onClick={handleSidebarClose}
            className="d-flex align-items-center gap-2 rounded-4 p-3 text-decoration-none"
            style={{ background: '#f6fdf5', color: '#1f2937' }}
          >
            <i className="bi bi-star-fill fs-5 text-warning"></i>
            Đánh giá
          </Link>
          <Link
            to="/login"
            onClick={() => {
              handleSidebarClose(); 
              handleLogout();      
            }}
            className="d-flex align-items-center gap-2 rounded-4 p-3 text-decoration-none mt-2"
            style={{ background: '#fff5f5', color: '#dc3545' }}
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
            <span className="fw-bold">Đăng xuất</span>
          </Link>
        </div>

        <div className="mb-4">
          <p className="text-success fw-semibold mb-3">Hệ thống</p>
          <button
            type="button"
            onClick={() => {
              handleSidebarClose();
              handleLegalOpen();
            }}
            className="d-flex align-items-center justify-content-between w-100 bg-white border-0 rounded-4 shadow-sm p-3 mb-3"
            style={{ color: '#1f2937' }}
          >
            <span>
              <span className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-shield-lock text-success fs-5"></i>
                Điều khoản và chính sách
              </span>
              <div className="small text-muted" style={{ lineHeight: 1.4 }}>
                Xem nội dung về quyền lợi, trách nhiệm và bảo mật thông tin.
              </div>
            </span>
            <i className="bi bi-chevron-right text-muted"></i>
          </button>
          <button
            type="button"
            className="d-flex align-items-center justify-content-between w-100 bg-white border-0 rounded-4 shadow-sm p-3"
            onClick={handleSidebarClose}
            style={{ color: '#1f2937' }}
          >
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-translate text-success fs-5"></i>
              Ngôn ngữ - Tiếng Việt
            </span>
            <i className="bi bi-chevron-right text-muted"></i>
          </button>
        </div>

        <button
          type="button"
          className="btn btn-danger w-100 rounded-4 fw-semibold mt-auto"
          onClick={() => {
            handleSidebarClose();
            handleLogout();
          }}
          style={{ padding: '0.95rem 1.25rem' }}
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Đăng xuất
        </button>
      </aside>

      {showLegalModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1060, backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onClick={handleLegalClose}
        >
          <div
            className="bg-white rounded-4 shadow p-4"
            style={{ width: 'min(680px, 95vw)', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h5 className="fw-bold mb-1">Điều khoản và chính sách</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  Nội dung điều khoản và chính sách sử dụng dịch vụ.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-light btn-sm rounded-circle border"
                onClick={handleLegalClose}
                style={{ width: '36px', height: '36px' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ lineHeight: 1.8, color: '#344054' }}>
              <p className="fw-semibold">1. Điều khoản sử dụng</p>
              <p>
                Người dùng đồng ý sử dụng hệ thống theo quy định, không chia sẻ tài khoản và chịu trách nhiệm về thông tin đặt sân.
              </p>
              <p className="fw-semibold">2. Chính sách bảo mật</p>
              <p>
                Chúng tôi bảo vệ dữ liệu cá nhân, cam kết không chia sẻ thông tin cho bên thứ ba khi chưa được phép.
              </p>
              <p className="fw-semibold">3. Quyền lợi và trách nhiệm</p>
              <p>
                Người dùng có quyền truy cập, chỉnh sửa và xóa thông tin cá nhân theo quy định, cùng tuân thủ các điều kiện đặt sân và thanh toán.
              </p>
            </div>
            <div className="text-end mt-4">
              <button className="btn btn-success" onClick={handleLegalClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main
        className="container-fluid py-4 flex-grow-1"
        style={{ maxWidth: '1440px' }}
      >
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-top pt-4 pb-2 mt-auto">
        <div className="container">
          <div className="row g-3 mb-3">
            <div className="col-lg-4 col-md-12">
              <h6 className="fw-bold mb-2" style={{ color: '#2D6A4F' }}>S.BOOK SYSTEM</h6>
              <p className="text-muted mb-0" style={{ fontSize: '12px', maxWidth: '300px' }}>
                Hệ thống đặt sân thể thao chuyên nghiệp. <br />
                <i className="bi bi-geo-alt-fill me-1"></i> Quận 9, TP. Hồ Chí Minh
              </p>
            </div>

            <div className="col-lg-5 col-md-8">
              <div className="row">
                <div className="col-4">
                  <p className="fw-bold small mb-2">Dịch vụ</p>
                  <ul className="list-unstyled mb-0" style={{ fontSize: '12px' }}>
                    <li><a href="#" className="text-decoration-none text-muted">Đặt sân</a></li>
                    <li><a href="#" className="text-decoration-none text-muted">Bảng giá</a></li>
                  </ul>
                </div>
                <div className="col-4">
                  <p className="fw-bold small mb-2">Hỗ trợ</p>
                  <ul className="list-unstyled mb-0" style={{ fontSize: '12px' }}>
                    <li><a href="#" className="text-decoration-none text-muted">Điều khoản</a></li>
                    <li><a href="#" className="text-decoration-none text-muted">Bảo mật</a></li>
                  </ul>
                </div>
                <div className="col-4">
                  <p className="fw-bold small mb-2">Liên hệ</p>
                  <ul className="list-unstyled mb-0" style={{ fontSize: '12px' }}>
                    <li className="text-muted text-truncate">028.123.456</li>
                    <li className="text-muted text-truncate">support@sbook.vn</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-4 text-lg-end">
              <p className="fw-bold small mb-2 text-uppercase">Thanh toán</p>
              <div className="d-flex justify-content-lg-end gap-2 mb-2">
                <img src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPAY" height="15" className="border rounded px-1" />
                <img src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png" alt="MOMO" height="15" className="border rounded px-1" />
              </div>
              <div className="d-flex justify-content-lg-end gap-3 text-muted">
                <a href="#" className="text-inherit"><i className="bi bi-facebook"></i></a>
                <a href="#" className="text-inherit"><i className="bi bi-youtube"></i></a>
              </div>
            </div>
          </div>

          <hr className="my-2 opacity-10" />

          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px' }}>
            <span className="text-muted">&copy; {new Date().getFullYear()} S.BOOK SYSTEM</span>
            <span className="fw-bold text-success">Team 4_23DTHB7 - HUTECH</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
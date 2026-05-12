import React, { useState } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [activeTab, setActiveTab] = useState('privacy');

  const handleSidebarOpen = () => setSidebarOpen(true);
  const handleSidebarClose = () => setSidebarOpen(false);
  const handleLegalOpen = (tabName = 'privacy') => {
    setActiveTab(tabName); // Đặt tab mục tiêu (privacy hoặc terms)
    setShowLegalModal(true); // Mở modal
  };
  const handleLegalClose = () => {
    setShowLegalModal(false);
    setActiveTab('privacy'); // Reset về tab đầu tiên khi đóng
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  const SidebarLink = ({ to, icon, label, onClick, iconColor = "text-success" }) => (
    <Link
      to={to}
      onClick={onClick}
      className="d-flex align-items-center gap-3 rounded-3 p-2 text-decoration-none transition-all sidebar-item"
      style={{ color: '#475569', fontSize: '0.95rem' }}
    >
      <div className="p-2 rounded-3 shadow-sm bg-white d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
        <i className={`bi ${icon} ${iconColor} fs-5`}></i>
      </div>
      <span className="fw-medium">{label}</span>
    </Link>
  );
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
        className="navbar navbar-expand-lg sticky-top shadow-sm"
        style={{
          zIndex: 1000,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '0.6rem 0', // Thu nhỏ padding để thanh gọn hơn
        }}
      >
        <div className="container-fluid px-lg-5">
          {/* LOGO */}
          <Link
            className="navbar-brand fw-bold fs-3"
            to="/"
            style={{
              color: '#1B4332',
              letterSpacing: '-1px',
              fontWeight: '800',
            }}
          >
            S.BOOK<span className="text-success">.</span>
          </Link>

          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            {/* MENU CHÍNH */}
            <ul className="navbar-nav ms-lg-4 gap-2">
              <li className="nav-item">
                <Link className="nav-link" style={{ ...getLinkStyle('/'), fontSize: '14px' }} to="/">Trang chủ</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" style={{ ...getLinkStyle('/football'), fontSize: '14px' }} to="/football">Bóng đá</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" style={{ ...getLinkStyle('/badminton'), fontSize: '14px' }} to="/badminton">Cầu lông</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" style={{ ...getLinkStyle('/pickleball'), fontSize: '14px' }} to="/pickleball">Pickleball</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" style={{ ...getLinkStyle('/contact'), fontSize: '14px' }} to="/contact">Liên hệ</Link>
              </li>

              {/* KHỐI QUẢN TRỊ CHO CHỦ SÂN (ROLE 2) */}
              {(user?.user?.role_id == 2 || user?.user?.role == 2) && (
                <li className="nav-item d-flex align-items-center gap-1 ms-lg-4 ps-lg-4 border-start" style={{ borderColor: '#e2e8f0' }}>
                  <Link className="nav-link px-2 text-center" to="/owner/dashboard">
                    <div className="d-flex flex-column align-items-center gap-0">
                      <i className="bi bi-graph-up" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>Thống kê</span>
                    </div>
                  </Link>

                  <Link className="nav-link px-2 text-center" to="/owner/schedule">
                    <div className="d-flex flex-column align-items-center gap-0">
                      <i className="bi bi-calendar3 text-primary" style={{ fontSize: '16px' }}></i>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>Xem lịch</span>
                    </div>
                  </Link>

                  <Link className="nav-link px-2 text-center" to="/owner/stadiums">
                    <div className="d-flex flex-column align-items-center gap-0">
                      <i className="bi bi-building text-success" style={{ fontSize: '16px' }}></i>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>Khu sân</span>
                    </div>
                  </Link>

                  <Link className="nav-link px-2 text-center" to="/owner/fields">
                    <div className="d-flex flex-column align-items-center gap-0">
                      <i className="bi bi-grid-3x3-gap text-success" style={{ fontSize: '16px' }}></i>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>Danh sách sân</span>
                    </div>
                  </Link>

                  <Link className="nav-link px-2 text-center" to="/history">
                    <div className="d-flex flex-column align-items-center gap-0">
                      <i className="bi bi-calendar-check text-primary" style={{ fontSize: '16px' }}></i>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>Duyệt đơn</span>
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

      <>
        {/* Overlay - Làm mờ nền chuyên nghiệp hơn */}
        {sidebarOpen && (
          <div
            onClick={handleSidebarClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)', // Thêm hiệu ứng blur nền cực xịn
              zIndex: 1040,
              transition: 'all 0.3s ease'
            }}
          />
        )}

        <aside
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '340px',
            maxWidth: '100%',
            padding: '2rem 1.5rem',
            backgroundColor: '#ffffff',
            boxShadow: '-10px 0 30px rgba(15, 23, 42, 0.1)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Animation mượt hơn
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}
        >
          {/* Header Section */}
          <div className="d-flex align-items-center justify-content-between mb-5">
            <div className="d-flex align-items-center gap-3">
              <div
                className="bg-success shadow-sm text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '52px',
                  height: '52px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)'
                }}
              >
                {user?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h5 className="fw-bold mb-0" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {user?.user?.name}
                </h5>
                <span className="badge bg-light text-success border border-success-subtle fw-normal">Thành viên S.Book</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close shadow-none"
              onClick={handleSidebarClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Menu Group 1: Hoạt động */}
          <div className="mb-4">
            <p className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              Hoạt động cá nhân
            </p>
            <nav className="d-flex flex-column gap-1">
              <SidebarLink to="/profile" icon="bi-person-circle" label="Hồ sơ cá nhân" onClick={handleSidebarClose} />
              <SidebarLink to="/history" icon="bi-calendar-check" label="Lịch sử đặt sân" onClick={handleSidebarClose} />
              <SidebarLink to="/favorites" icon="bi-heart" label="Sân bóng yêu thích" onClick={handleSidebarClose} iconColor="text-danger" />
              <SidebarLink to="/my-reviews" icon="bi-star" label="Đánh giá của tôi" onClick={handleSidebarClose} iconColor="text-warning" />
            </nav>
          </div>

          <hr className="my-4 opacity-10" />

          {/* Menu Group 2: Hệ thống */}
          <div className="mb-4">
            <p className="text-muted text-uppercase fw-bold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
              Thông tin & Hỗ trợ
            </p>
            <div className="d-flex flex-column gap-2">
              <button
                onClick={() => { handleSidebarClose(); handleLegalOpen(); }}
                className="btn btn-link text-decoration-none text-start p-0 d-flex align-items-center justify-content-between text-dark group"
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light p-2 rounded-3"><i className="bi bi-shield-check text-success"></i></div>
                  <span style={{ fontSize: '0.95rem' }}>Chính sách & Điều khoản</span>
                </div>
                <i className="bi bi-chevron-right small text-muted"></i>
              </button>

              <div className="d-flex align-items-center justify-content-between py-2 mt-2">
                <div className="d-flex align-items-center gap-3 text-dark">
                  <div className="bg-light p-2 rounded-3"><i className="bi bi-translate text-success"></i></div>
                  <span style={{ fontSize: '0.95rem' }}>Ngôn ngữ</span>
                </div>
                <span className="badge bg-light text-dark fw-normal border">Tiếng Việt</span>
              </div>
            </div>
          </div>

          {/* Logout Section - Đẩy xuống cuối */}
          <div className="mt-auto pt-4">
            <button
              type="button"
              className="btn btn-outline-danger w-100 rounded-4 border-2 fw-bold d-flex align-items-center justify-content-center gap-2"
              onClick={() => {
                handleSidebarClose();
                handleLogout();
              }}
              style={{ padding: '0.8rem' }}
            >
              <i className="bi bi-box-arrow-right"></i>
              Đăng xuất
            </button>
            <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.7rem' }}>Phiên bản 2.0.1 - S.BOOK Team</p>
          </div>
        </aside>
      </>

      {showLegalModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 2000,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            top: 0, left: 0, right: 0, bottom: 0,
            backdropFilter: 'blur(4px)'
          }}
          onClick={handleLegalClose}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-0 d-flex flex-column"
            style={{
              width: '95vw',
              height: '90vh',
              maxWidth: '1200px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header với Tabs */}
            <div className="p-4 border-bottom bg-light rounded-top-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0 text-success">PHÁP LÝ & QUY ĐỊNH S.BOOK</h4>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={handleLegalClose}
                ></button>
              </div>

              {/* Thanh điều hướng Tab */}
              <div className="d-flex gap-2">
                <button
                  className={`btn btn-sm rounded-pill px-4 fw-bold ${activeTab === 'privacy' ? 'btn-success' : 'btn-outline-secondary border-0'}`}
                  onClick={() => setActiveTab('privacy')}
                >
                  1. CHÍNH SÁCH BẢO MẬT
                </button>
                <button
                  className={`btn btn-sm rounded-pill px-4 fw-bold ${activeTab === 'terms' ? 'btn-success' : 'btn-outline-secondary border-0'}`}
                  onClick={() => setActiveTab('terms')}
                >
                  2. QUY CHẾ HOẠT ĐỘNG
                </button>
              </div>
            </div>

            {/* Nội dung thay đổi theo Tab */}
            <div className="p-4 flex-grow-1 overflow-auto" style={{ lineHeight: 1.7, color: '#344054', textAlign: 'justify' }}>

              {activeTab === 'privacy' ? (
                /* NỘI DUNG CHÍNH SÁCH BẢO MẬT */
                <>
                  <h5 className="fw-bold text-dark mb-3 text-uppercase">Chính sách bảo vệ thông tin cá nhân</h5>
                  <section className="mb-4">
                    <h6 className="fw-bold text-success">1. Mục đích thu thập thông tin cá nhân</h6>
                    <p>Thông tin bao gồm tên, địa chỉ, số điện thoại, email... thu thập nhằm phục vụ Giao dịch, Hỗ trợ, Thanh toán và Pháp lý nội bộ của S.Book.</p>
                    <ul>
                      <li><strong>Giao dịch:</strong> Chuyển tiếp đơn đặt lịch đến các cơ sở thể thao đối tác tại TP.HCM.</li>
                      <li><strong>Hỗ trợ:</strong> Xác minh độ tin cậy và thông báo lịch đặt.</li>
                    </ul>
                  </section>
                  <section className="mb-4">
                    <h6 className="fw-bold text-success">2. Phạm vi sử dụng & Thời gian lưu trữ</h6>
                    <p>S.Book cam kết không mua bán dữ liệu cho bên thứ ba. Dữ liệu được lưu trữ cho đến khi hoàn thành mục đích hoặc khi thành viên yêu cầu hủy bỏ.</p>
                  </section>
                  <section className="mb-4">
                    <h6 className="fw-bold text-success">3. Cam kết bảo mật</h6>
                    <p>Áp dụng các biện pháp an ninh nghiêm ngặt để chống mất mát dữ liệu. Chỉ tiết lộ thông tin khi có yêu cầu pháp lý từ cơ quan Nhà nước.</p>
                  </section>
                </>
              ) : (
                /* NỘI DUNG QUY CHẾ HOẠT ĐỘNG */
                <>
                  <h5 className="fw-bold text-dark mb-3 text-uppercase">Quy chế hoạt động nền tảng S.Book</h5>
                  <div className="alert alert-success border-0 rounded-3 small">
                    S.BOOK là nền tảng kết nối người chơi và các cơ sở thể thao, cho phép tìm kiếm và đặt lịch trực tuyến minh bạch.
                  </div>

                  <section className="mb-4">
                    <h6 className="fw-bold text-success">I. Nguyên tắc chung</h6>
                    <p>Nền tảng vận hành bởi Ban quản trị S.Book. Thành viên tham gia dựa trên tinh thần tự nguyện, tôn trọng quyền lợi hợp pháp và tuân thủ pháp luật Việt Nam.</p>
                  </section>

                  <section className="mb-4">
                    <h6 className="fw-bold text-success">II. Quy trình giao dịch cho Khách hàng</h6>
                    <ol>
                      <li>Tìm kiếm sân theo môn, khu vực và thời gian.</li>
                      <li>Chọn sân và kiểm tra lịch trống.</li>
                      <li>Nhập mã giảm giá và chọn hình thức thanh toán.</li>
                      <li>Nhận xác nhận qua Email/App.</li>
                    </ol>
                  </section>

                  <section className="mb-4">
                    <h6 className="fw-bold text-success">III. Giải quyết tranh chấp</h6>
                    <p>Tiếp nhận khiếu nại qua Hotline: <strong>098 242 13 13</strong> hoặc Email: <strong>support@sbook.vn</strong>. Mọi tranh chấp được ưu tiên giải quyết qua thương lượng thiện chí.</p>
                  </section>

                  <section className="mb-4 bg-light p-3 rounded-3">
                    <h6 className="fw-bold text-danger">IV. Hành vi nghiêm cấm</h6>
                    <ul className="mb-0">
                      <li>Sử dụng công cụ can thiệp hệ thống dữ liệu.</li>
                      <li>Đăng tải nội dung đồi trụy hoặc sai sự thật.</li>
                      <li>Tạo đơn hàng giả gây lũng đoạn thị trường.</li>
                    </ul>
                  </section>
                </>
              )}

              <div className="text-center mt-5 mb-3 py-3 border-top">
                <h6 className="fw-bold text-success">S.Book - Nền tảng đặt sân trực tuyến hàng đầu tại TP. Hồ Chí Minh.</h6>
                <small className="text-muted">Cập nhật lần cuối: Tháng 5/2026</small>
              </div>
            </div>

            {/* Footer cố định */}
            <div className="p-3 border-top text-end bg-light rounded-bottom-4">
              <button className="btn btn-success px-5 fw-bold" onClick={handleLegalClose}>
                TÔI ĐÃ HIỂU VÀ ĐỒNG Ý
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

      {/* FOOTER GỌN GÀNG & ĐẦY ĐỦ THÔNG TIN */}
      <footer className="bg-white border-top pt-4 pb-2 mt-auto">
        <div className="container">
          <div className="row g-3 mb-3">
            {/* Cột chính: Brand */}
            <div className="col-lg-4 col-md-12">
              <h6 className="fw-bold mb-2" style={{ color: '#2D6A4F' }}>S.BOOK SYSTEM</h6>
              <p className="text-muted mb-0" style={{ fontSize: '12px', maxWidth: '300px' }}>
                Hệ thống đặt sân thể thao chuyên nghiệp. <br />
                <i className="bi bi-geo-alt-fill me-1"></i> Quận 9, TP. Hồ Chí Minh
              </p>
            </div>

            {/* Cột Links: Dàn ngang tiết kiệm chỗ */}
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
                    <li>
                      <span
                        className="text-decoration-none text-muted"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleLegalOpen('terms')} // Mở tab Quy chế/Điều khoản
                      >
                        Điều khoản
                      </span>
                    </li>
                    <li>
                      <span
                        className="text-decoration-none text-muted"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleLegalOpen('privacy')} // Mở tab Bảo mật
                      >
                        Chính sách
                      </span>
                    </li>
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

            {/* Cột Social & Payment */}
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

          {/* Tầng cuối: Copyright */}
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

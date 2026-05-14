import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminMenuSections = [
  {
    title: 'Admin',
    items: [
      { to: '/admin/dashboard', label: 'Tong quan' },
      { to: '/admin/users', label: 'Quan ly Tai khoan' },
      { to: '/admin/stadiums', label: 'Quan ly San The Thao' },
      { to: '/admin/hashtags', label: 'Hashtag' },
      { to: '/admin/activity-logs', label: 'Nhat ky' },
      { to: '/admin/complaints', label: 'Khieu nai' },
    ],
  },
  {
    title: 'Owner',
    items: [
      { to: '/admin/owner/overview', label: 'Van hanh chu san' },
      { to: '/admin/owner/stadiums', label: 'Khu san' },
      { to: '/admin/owner/fields', label: 'Danh sach san' },
      { to: '/admin/owner/bookings', label: 'Quan ly don' },
      { to: '/admin/owner/reviews', label: 'Danh gia san' },
    ],
  },
  {
    title: 'User',
    items: [{ to: '/admin/book-field', label: 'Dat san' }],
  },
];

const accountMenuItems = [
  {
    to: '/admin/profile',
    label: 'Ho so',
    icon: 'bi-person-fill',
    background: '#f6fdf5',
    color: '#1f2937',
    iconColor: '#198754',
  },
  {
    to: '/admin/history',
    label: 'Danh sach lich da dat',
    icon: 'bi-calendar-check',
    background: '#f6fdf5',
    color: '#1f2937',
    iconColor: '#198754',
  },
  {
    to: '/admin/favorites',
    label: 'San yeu thich',
    icon: 'bi-heart-fill',
    background: '#f6fdf5',
    color: '#1f2937',
    iconColor: '#dc3545',
  },
  {
    to: '/admin/my-complaints',
    label: 'Khieu nai cua toi',
    icon: 'bi-exclamation-triangle-fill',
    background: '#fff8f1',
    color: '#1f2937',
    iconColor: '#f59e0b',
  },
  {
    to: '/admin/my-reviews',
    label: 'Danh gia',
    icon: 'bi-star-fill',
    background: '#f6fdf5',
    color: '#1f2937',
    iconColor: '#f0ad00',
  },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
      ? 'text-success border-bottom border-3 border-success'
      : 'text-secondary';

  const getInitial = () =>
    (user?.user?.full_name || user?.user?.name || 'A').charAt(0).toUpperCase();

  const activeMenuItem =
    adminMenuSections
      .flatMap((section) => section.items)
      .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) ||
    adminMenuSections[0].items[0];

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-white bg-white shadow-sm sticky-top py-3">
        <div className="container">
          <Link className="navbar-brand fw-bold d-flex align-items-center" to="/admin/dashboard">
            <div className="bg-success text-white rounded-3 p-2 me-2">
              <i className="bi bi-shield-check"></i>
            </div>
            <span className="text-dark">
              He thong <span className="text-success">Admin</span>
            </span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNavbar"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="adminNavbar">
            <div className="admin-menu-dropdown mx-auto position-relative">
              <button
                type="button"
                className="btn btn-light border shadow-sm d-flex align-items-center justify-content-between gap-3 px-3 py-2 w-100"
                style={{ minWidth: '300px', borderRadius: '16px' }}
                onClick={() => setMenuOpen((current) => !current)}
              >
                <span className="d-flex flex-column align-items-start text-start">
                  <span className="small text-muted text-uppercase fw-bold">Chuc nang</span>
                  <span className="fw-semibold text-dark">{activeMenuItem.label}</span>
                </span>
                <i className={`bi ${menuOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-success`}></i>
              </button>

              {menuOpen && (
                <div className="admin-menu-panel position-absolute start-0 mt-2 bg-white border shadow rounded-4 p-2">
                  {adminMenuSections.map((section) => (
                    <div key={section.title} className="mb-2">
                      <div
                        className={`admin-menu-label px-3 pt-2 pb-1 text-uppercase small fw-bold ${
                          section.title === 'Admin' ? 'admin-section-highlight' : 'owner-section-highlight'
                        }`}
                      >
                        <span className="d-inline-flex align-items-center gap-2">
                          <i className={`bi ${section.title === 'Admin' ? 'bi-shield-lock-fill' : 'bi-buildings-fill'}`}></i>
                          {section.title}
                        </span>
                      </div>
                      {section.items.map((item) => (
                        <Link
                          key={item.to}
                          className={`dropdown-item admin-menu-item rounded-3 px-3 py-2 ${isActive(item.to)}`}
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-sm-block">
                <p className="mb-0 small fw-bold">{user?.user?.full_name || user?.user?.name || 'Admin'}</p>
                <p className="mb-0 x-small text-muted" style={{ fontSize: '0.75rem' }}>
                  Quan tri vien cap cao
                </p>
              </div>

              <button
                type="button"
                className="btn btn-white border shadow-sm d-flex align-items-center gap-2 px-2 py-2"
                onClick={() => setDrawerOpen(true)}
                style={{ borderRadius: '16px' }}
              >
                <div
                  className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', fontWeight: '700' }}
                >
                  {getInitial()}
                </div>
                <span className="fw-semibold pe-2">{user?.user?.full_name || user?.user?.name || 'Admin'}</span>
              </button>

              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
                <i className="bi bi-box-arrow-left me-1"></i> Thoat
              </button>
            </div>
          </div>
        </div>
      </nav>

      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
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
          width: '360px',
          maxWidth: '100%',
          padding: '1.5rem',
          backgroundColor: '#ffffff',
          boxShadow: 'rgba(15, 23, 42, 0.18) 0px 28px 90px',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(120%)',
          transition: 'transform 0.28s ease',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div>
            <p className="user-panel-badge text-uppercase small mb-2">
              <span className="d-inline-flex align-items-center gap-2">
                <i className="bi bi-person-badge-fill"></i>
                User
              </span>
            </p>
            <div className="d-flex align-items-center gap-3">
              <div
                className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '56px', height: '56px', fontWeight: 800, fontSize: '1.5rem' }}
              >
                {getInitial()}
              </div>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#1f2937' }}>
                  {user?.user?.full_name || user?.user?.name || 'Admin'}
                </h5>
                <p className="text-muted mb-0">Chao mung ban tro lai</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-light btn-sm rounded-circle border"
            onClick={() => setDrawerOpen(false)}
            style={{ width: '36px', height: '36px' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="mb-4">
          <p className="user-activity-title fw-semibold mb-3">Hoat dong ca nhan</p>
          {accountMenuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setDrawerOpen(false)}
              className="d-flex align-items-center gap-2 rounded-4 p-3 mb-3 text-decoration-none"
              style={{ background: item.background, color: item.color }}
            >
              <i className={`bi ${item.icon} fs-5`} style={{ color: item.iconColor }}></i>
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className="w-100 d-flex align-items-center gap-2 rounded-4 p-3 border-0 mt-2"
            style={{ background: '#fff5f5', color: '#dc3545' }}
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
            <span className="fw-bold">Dang xuat</span>
          </button>
        </div>

        <div className="mt-auto">
          <p className="text-success fw-semibold mb-3">He thong</p>
          <button
            type="button"
            onClick={() => setShowLegalModal(true)}
            className="d-flex align-items-center justify-content-between w-100 bg-white rounded-4 shadow-sm p-3 border-0"
            style={{ color: '#1f2937' }}
          >
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock text-success fs-5"></i>
              Dieu khoan va chinh sach
            </span>
            <i className="bi bi-chevron-right text-muted"></i>
          </button>
        </div>
      </aside>

      {showLegalModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1060, backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onClick={() => setShowLegalModal(false)}
        >
          <div
            className="bg-white rounded-4 shadow p-4"
            style={{ width: 'min(680px, 95vw)', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h5 className="fw-bold mb-1">Dieu khoan va chinh sach</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  Noi dung dieu khoan va chinh sach su dung dich vu.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-light btn-sm rounded-circle border"
                onClick={() => setShowLegalModal(false)}
                style={{ width: '36px', height: '36px' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ lineHeight: 1.8, color: '#344054' }}>
              <p className="fw-semibold">1. Dieu khoan su dung</p>
              <p>
                Nguoi dung dong y su dung he thong theo quy dinh, khong chia se tai khoan va chiu
                trach nhiem ve thong tin dat san.
              </p>
              <p className="fw-semibold">2. Chinh sach bao mat</p>
              <p>
                Chung toi bao ve du lieu ca nhan, cam ket khong chia se thong tin cho ben thu ba
                khi chua duoc phep.
              </p>
              <p className="fw-semibold">3. Quyen loi va trach nhiem</p>
              <p>
                Nguoi dung co quyen truy cap, chinh sua va xoa thong tin ca nhan theo quy dinh,
                cung tuan thu cac dieu kien dat san va thanh toan.
              </p>
            </div>
            <div className="text-end mt-4">
              <button className="btn btn-success" onClick={() => setShowLegalModal(false)}>
                Dong
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container py-5">
        <div className="fade-in">
          <Outlet />
        </div>
      </main>

      <style>{`
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-link {
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .admin-menu-dropdown {
          width: min(100%, 340px);
        }
        .admin-menu-panel {
          width: min(92vw, 360px);
          z-index: 1045;
          max-height: 70vh;
          overflow-y: auto;
        }
        .admin-menu-label {
          letter-spacing: 0.08em;
          white-space: nowrap;
        }
        .admin-section-highlight {
          color: #0f5132;
        }
        .admin-section-highlight span {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border: 1px solid #86efac;
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          box-shadow: 0 8px 18px rgba(25, 135, 84, 0.12);
        }
        .owner-section-highlight {
          color: #1f2937;
        }
        .owner-section-highlight span {
          background: linear-gradient(135deg, #eef2ff, #e0f2fe);
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
        }
        .admin-menu-item {
          color: #475467;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .admin-menu-item:hover {
          background: #f6fdf5;
          color: #198754 !important;
        }
        .user-panel-badge {
          color: #0f5132;
        }
        .user-panel-badge span {
          background: linear-gradient(135deg, #dcfce7, #d1fae5);
          border: 1px solid #86efac;
          border-radius: 999px;
          padding: 0.4rem 0.8rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          box-shadow: 0 10px 20px rgba(25, 135, 84, 0.14);
        }
        .user-activity-title {
          color: #0f5132;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
          padding: 0.45rem 0.85rem;
        }
        .user-activity-title::before {
          content: '●';
          color: #16a34a;
          font-size: 0.8rem;
        }
        .nav-link:hover {
          color: #198754 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;

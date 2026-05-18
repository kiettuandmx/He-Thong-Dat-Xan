import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminMenuSections = [
  {
    title: 'Quản trị',
    icon: 'bi-shield-lock-fill',
    items: [
      { to: '/admin/dashboard', label: 'Tổng quan' },
      { to: '/admin/users', label: 'Quản lý tài khoản' },
      { to: '/admin/stadiums', label: 'Quản lý sân thể thao' },
      { to: '/admin/hashtags', label: 'Quản lý hashtag' },
      { to: '/admin/activity-logs', label: 'Nhật ký hoạt động' },
      { to: '/admin/complaints', label: 'Xử lý khiếu nại' },
    ],
  },
  {
    title: 'Vận hành chủ sân',
    icon: 'bi-buildings-fill',
    items: [
      { to: '/admin/owner/overview', label: 'Tổng quan chủ sân' },
      { to: '/admin/owner/stadiums', label: 'Khu sân' },
      { to: '/admin/owner/fields', label: 'Danh sách sân' },
      { to: '/admin/owner/bookings', label: 'Quản lý đơn đặt' },
      { to: '/admin/owner/reviews', label: 'Đánh giá sân' },
    ],
  },
  {
    title: 'Người dùng',
    icon: 'bi-person-lines-fill',
    items: [{ to: '/admin/book-field', label: 'Đặt sân thay người dùng' }],
  },
];

const accountMenuItems = [
  { to: '/admin/profile', label: 'Hồ sơ', icon: 'bi-person-fill', tone: 'emerald' },
  {
    to: '/admin/history',
    label: 'Danh sách lịch đã đặt',
    icon: 'bi-calendar-check',
    tone: 'emerald',
  },
  { to: '/admin/favorites', label: 'Sân yêu thích', icon: 'bi-heart-fill', tone: 'rose' },
  {
    to: '/admin/my-complaints',
    label: 'Khiếu nại của tôi',
    icon: 'bi-exclamation-triangle-fill',
    tone: 'amber',
  },
  { to: '/admin/my-reviews', label: 'Đánh giá', icon: 'bi-star-fill', tone: 'gold' },
];

const matchesPath = (pathname, path) =>
  pathname === path || pathname.startsWith(`${path}/`);

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  const getInitial = () =>
    (user?.user?.full_name || user?.user?.name || 'A').charAt(0).toUpperCase();

  const displayName = user?.user?.full_name || user?.user?.name || 'Admin';

  const activeMenuItem = useMemo(
    () =>
      adminMenuSections
        .flatMap((section) => section.items)
        .find((item) => matchesPath(location.pathname, item.to)) || adminMenuSections[0].items[0],
    [location.pathname]
  );

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar__inner">
          <Link className="admin-brand" to="/admin/dashboard">
            <span className="admin-brand__badge">
              <i className="bi bi-shield-check" />
            </span>
            <span className="admin-brand__copy">
              <strong>Hệ thống Admin</strong>
              <small>Điều phối và kiểm soát vận hành</small>
            </span>
          </Link>

          <div className="admin-nav-switcher">
            <button
              type="button"
              className="admin-nav-switcher__trigger"
              aria-expanded={menuOpen}
              aria-label={`Chức năng hiện tại ${activeMenuItem.label}`}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span className="admin-nav-switcher__copy">
                <small>Chức năng hiện tại</small>
                <strong>{activeMenuItem.label}</strong>
              </span>
              <i className={`bi ${menuOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
            </button>

            {menuOpen ? (
              <div className="admin-nav-panel">
                {adminMenuSections.map((section) => (
                  <section key={section.title} className="admin-nav-panel__section">
                    <p className="admin-nav-panel__label">
                      <i className={`bi ${section.icon}`} />
                      <span>{section.title}</span>
                    </p>
                    <div className="admin-nav-panel__list">
                      {section.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`admin-nav-panel__item ${
                            matchesPath(location.pathname, item.to) ? 'is-active' : ''
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </div>

          <div className="admin-topbar__actions">
            <button
              type="button"
              className="admin-account-trigger"
              aria-label={displayName}
              onClick={() => setDrawerOpen(true)}
            >
              <span className="admin-account-trigger__avatar">{getInitial()}</span>
              <span className="admin-account-trigger__meta">
                <strong>{displayName}</strong>
                <small>Điều phối hệ thống</small>
              </span>
            </button>

            <button type="button" className="admin-logout-button" onClick={handleLogout}>
              <i className="bi bi-box-arrow-left" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`admin-drawer-backdrop ${drawerOpen || showLegalModal ? 'is-open' : ''}`}
        onClick={() => {
          setDrawerOpen(false);
          setShowLegalModal(false);
        }}
      />

      <aside className={`admin-account-drawer ${drawerOpen ? 'is-open' : ''}`}>
        <div className="admin-account-drawer__header">
          <div>
            <p className="admin-account-drawer__eyebrow">Tài khoản admin</p>
            <div className="admin-account-card">
              <span className="admin-account-card__avatar">{getInitial()}</span>
              <div>
                <h2>{displayName}</h2>
                <p>Chào mừng bạn trở lại</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="admin-icon-button"
            aria-label="Đóng bảng tài khoản"
            onClick={() => setDrawerOpen(false)}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="admin-account-drawer__section">
          <p className="admin-account-drawer__title">Hoạt động cá nhân</p>
          <div className="admin-account-link-list">
            {accountMenuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`admin-account-link admin-account-link--${item.tone}`}
                onClick={() => setDrawerOpen(false)}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <button type="button" className="admin-account-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" />
            <span>Đăng xuất</span>
          </button>
        </div>

        <div className="admin-account-drawer__footer">
          <p className="admin-account-drawer__title">Hệ thống</p>
          <button
            type="button"
            className="admin-legal-button"
            onClick={() => setShowLegalModal(true)}
          >
            <span>
              <i className="bi bi-shield-lock" />
              <span>Điều khoản và chính sách</span>
            </span>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </aside>

      {showLegalModal ? (
        <div className="admin-modal-layer" onClick={() => setShowLegalModal(false)}>
          <div className="admin-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-card__header">
              <div>
                <h2>Điều khoản và chính sách</h2>
                <p>Nội dung điều khoản và chính sách sử dụng dịch vụ.</p>
              </div>
              <button
                type="button"
                className="admin-icon-button"
                aria-label="Đóng cửa sổ chính sách"
                onClick={() => setShowLegalModal(false)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="admin-modal-card__body">
              <p className="admin-modal-card__heading">1. Điều khoản sử dụng</p>
              <p>
                Người dùng đồng ý sử dụng hệ thống theo quy định, không chia sẻ tài khoản và chịu
                trách nhiệm về thông tin đặt sân.
              </p>
              <p className="admin-modal-card__heading">2. Chính sách bảo mật</p>
              <p>
                Chúng tôi bảo vệ dữ liệu cá nhân, cam kết không chia sẻ thông tin cho bên thứ ba
                khi chưa được phép.
              </p>
              <p className="admin-modal-card__heading">3. Quyền lợi và trách nhiệm</p>
              <p>
                Người dùng có quyền truy cập, chỉnh sửa và xóa thông tin cá nhân theo quy định,
                cũng tuân thủ các điều kiện đặt sân và thanh toán.
              </p>
            </div>

            <div className="admin-modal-card__footer">
              <button
                type="button"
                className="admin-modal-card__confirm"
                onClick={() => setShowLegalModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="admin-shell__content">
        <div className="admin-shell__content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

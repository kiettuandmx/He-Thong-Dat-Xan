import React, { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImage from '../../image/Logo.png';

const publicLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/football', label: 'Bóng đá' },
  { to: '/badminton', label: 'Cầu lông' },
  { to: '/pickleball', label: 'Pickleball' },
];

const ownerLinks = [
  { to: '/owner/dashboard', label: 'Tổng quan chủ sân' },
  { to: '/owner/stadiums', label: 'Khu sân của tôi' },
  { to: '/owner/fields', label: 'Danh sách sân' },
  { to: '/owner/recurring-requests', label: 'Yêu cầu đặt định kỳ' },
  { to: '/owner/reviews', label: 'Đánh giá nhận được' },
];

const userAccountLinks = [
  { to: '/profile', label: 'Hồ sơ của tôi', icon: 'bi-person' },
  { to: '/history', label: 'Lịch sử đặt sân', icon: 'bi-calendar-check' },
  { to: '/payment-history', label: 'Lịch sử thanh toán', icon: 'bi-wallet2' },
  { to: '/wallet', label: 'Ví tiền của tôi', icon: 'bi-credit-card-2-front' },
  { to: '/recurring-bookings', label: 'Đặt sân định kỳ', icon: 'bi-calendar2-week' },
  { to: '/favorites', label: 'Sân yêu thích', icon: 'bi-heart' },
  { to: '/complaints', label: 'Khiếu nại của tôi', icon: 'bi-chat-left-text' },
  { to: '/my-reviews', label: 'Đánh giá của tôi', icon: 'bi-star' },
];

const ownerAccountLinks = [
  { to: '/owner/payment-history', label: 'Doanh thu và thanh toán', icon: 'bi-cash-stack' },
  { to: '/owner/reviews', label: 'Đánh giá sân', icon: 'bi-star' },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentUser = user?.user || user || null;
  const roleId = Number(currentUser?.role_id || currentUser?.role || 0);
  const isOwner = roleId === 2;

  const accountLinks = useMemo(
    () => [...userAccountLinks, ...(isOwner ? ownerAccountLinks : [])],
    [isOwner]
  );

  const getInitial = () => {
    const source = currentUser?.name || currentUser?.email || 'U';
    return source.charAt(0).toUpperCase();
  };

  const navClassName = (path) =>
    location.pathname === path ? 'main-nav__link is-active' : 'main-nav__link';

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = () => {
    closeDrawer();
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="main-header">
        <div className="main-header__inner">
          <Link className="brand-mark" to="/">
            <img className="brand-mark__image" src={logoImage} alt="S-Book" />
          </Link>

          <nav className="main-nav" aria-label="Điều hướng chính">
            {publicLinks.map((link) => (
              <Link key={link.to} className={navClassName(link.to)} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="main-header__actions">
            {isOwner && (
              <Link className="owner-shortcut text-decoration-none" to="/owner/dashboard">
                <span className="owner-shortcut__label">Khu vực chủ sân</span>
                <small className="owner-shortcut__meta">Bảng điều hành</small>
              </Link>
            )}

            {currentUser ? (
              <button
                type="button"
                className="account-trigger"
                onClick={() => setDrawerOpen(true)}
              >
                Tài khoản
              </button>
            ) : (
              <Link className="account-trigger text-decoration-none" to="/login">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      {currentUser && (
        <>
          <button
            type="button"
            aria-label="Đóng bảng tài khoản"
            className={`account-drawer-backdrop ${drawerOpen ? 'is-open' : ''}`}
            onClick={closeDrawer}
          />
          <aside className={`account-drawer ${drawerOpen ? 'is-open' : ''}`}>
            <div className="account-drawer__header">
              <div className="d-flex align-items-center gap-3">
                <span className="account-avatar">{getInitial()}</span>
                <div>
                  <p className="eyebrow mb-1">Tài khoản</p>
                  <h2 className="h5 fw-bold mb-1">{currentUser?.name || 'Người dùng'}</h2>
                  <p className="text-muted mb-0">
                    {isOwner
                      ? 'Điều hành khu sân, doanh thu và chất lượng dịch vụ trong một nơi.'
                      : 'Theo dõi đặt sân và hoạt động của bạn.'}
                  </p>
                </div>
              </div>
            </div>

            {isOwner && (
              <section className="account-drawer__section">
                <p className="account-drawer__title">Lối tắt quản lý</p>
                <div className="account-link-list">
                  {ownerLinks.map((link) => (
                    <Link
                      key={link.to}
                      className="account-link-item"
                      onClick={closeDrawer}
                      to={link.to}
                    >
                      <i className="bi bi-grid"></i>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="account-drawer__section">
              <p className="account-drawer__title">Tác vụ cá nhân</p>
              <div className="account-link-list">
                {accountLinks.map((link) => (
                  <Link
                    key={link.to}
                    className="account-link-item"
                    onClick={closeDrawer}
                    to={link.to}
                  >
                    <i className={`bi ${link.icon}`}></i>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="account-drawer__section">
              <p className="account-drawer__title">Phiên làm việc</p>
              <button type="button" className="secondary-button w-100" onClick={handleLogout}>
                Đăng xuất
              </button>
            </section>
          </aside>
        </>
      )}
    </div>
  );
};

export default MainLayout;

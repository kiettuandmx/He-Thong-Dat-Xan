import React from 'react';
import PropTypes from 'prop-types';

const MainLayout = ({ children }) => {
  return (
    <div
      style={{
        width: '115%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
      }}
    >
      <nav
        className="navbar navbar-expand-lg position-sticky top-0 w-100"
        style={{
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      >
        <div className="container-fluid px-5">
          {/* LEFT - LOGO */}
          <a
            className="navbar-brand fw-bold fs-2"
            href="#"
            style={{ color: '#198754' }}
          >
            S-BOOK
          </a>

          {/* TOGGLE */}
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* CENTER - MENU */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-4 d-flex gap-4">
              {' '}
              {/* Thay mx-auto thành ms-4 */}
              <li className="nav-item">
                <a className="nav-link text-success fw-semibold" href="#">
                  Trang chủ
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Bóng đá
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Cầu lông
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Bóng chuyền
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Tennis
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Pickleball
                </a>
              </li>
            </ul>
          </div>

          {/* RIGHT - BUTTON */}
          <div className="d-flex gap-2 ms-auto">
            <button className="btn btn-danger px-4 fw-bold">Đăng ký</button>
            <button className="btn btn-primary px-4 fw-bold">Đăng nhập</button>
          </div>
        </div>
      </nav>

      <main className="w-100">{children}</main>
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;

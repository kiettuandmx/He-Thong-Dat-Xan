import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Hàm kiểm tra active link để tô màu nút
    const isActive = (path) => location.pathname === path ? 'text-success border-bottom border-3 border-success' : 'text-secondary';

    return (
        <div className="min-vh-100 bg-light">
            {/* --- NAVBAR PHÍA TRÊN --- */}
            <nav className="navbar navbar-expand-lg navbar-white bg-white shadow-sm sticky-top py-3">
                <div className="container">
                    <Link className="navbar-brand fw-bold d-flex align-items-center" to="/admin/dashboard">
                        <div className="bg-success text-white rounded-3 p-2 me-2">
                            <i className="bi bi-shield-check"></i>
                        </div>
                        <span className="text-dark">Hệ thống <span className="text-success">Admin</span></span>
                    </Link>

                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="adminNavbar">
                        <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-3">
                            <li className="nav-item">
                                <Link className={`nav-link fw-semibold px-3 ${isActive('/admin/dashboard')}`} to="/admin/dashboard">
                                    Tổng quan
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`nav-link fw-semibold px-3 ${isActive('/admin/users')}`} to="/admin/users">
                                    Người dùng
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`nav-link fw-semibold px-3 ${isActive('/admin/stadiums')}`} to="/admin/stadiums">
                                    Quản lý Sân Thể Thao
                                </Link>
                            </li>
                        </ul>

                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end d-none d-sm-block">
                                <p className="mb-0 small fw-bold">{user?.user?.full_name || 'Admin'}</p>
                                <p className="mb-0 x-small text-muted" style={{ fontSize: '0.75rem' }}>Quản trị viên cấp cao</p>
                            </div>
                            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
                                <i className="bi bi-box-arrow-left me-1"></i> Thoát
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- NỘI DUNG CHÍNH --- */}
            <main className="container py-5">
                {/* Hiệu ứng mờ dần khi chuyển trang */}
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
                }
                .nav-link:hover {
                    color: #198754 !important;
                }
            `}</style>
        </div>
    );
};

export default AdminLayout;
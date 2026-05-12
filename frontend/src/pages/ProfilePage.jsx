import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ProfilePage = () => {
    const { user } = useAuth(); // Lấy thông tin user đang đăng nhập từ Context
    console.log('Dữ liệu User hiện tại:', user);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.user?.name || '',
        phone: user?.user?.phone || '',
        email: user?.user?.email || '',
    });

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // API cập nhật thông tin (Lam cần viết thêm ở Backend nếu chưa có)
            await axios.put(
                `http://localhost:5000/api/users/profile/${user.user.id}`,
                formData
            );
            alert('Cập nhật thông tin thành công!');
            setIsEditing(false);
        } catch (err) {
            alert('Lỗi khi cập nhật thông tin', err.message);
        }
    };

    return (
        <div
            className="container-fluid py-5 px-md-5"
            style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                minHeight: '100vh',
                fontFamily: "'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div className="row g-4 justify-content-center">
                {/* CỘT TRÁI: Profile Sidebar (3 phần 12) */}
                <div className="col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white">
                        <div className="p-4 text-center">
                            <div className="position-relative d-inline-block mb-4">
                                <div className="rounded-circle p-1 bg-success shadow-sm">
                                    <div
                                        className="bg-white text-success rounded-circle d-flex align-items-center justify-content-center fw-black"
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            fontSize: '40px',
                                        }}
                                    >
                                        {user?.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <span className="position-absolute bottom-0 end-0 bg-success border border-white border-3 rounded-circle p-2"></span>
                            </div>

                            <h4 className="fw-bold text-dark mb-1">{user?.user?.name}</h4>
                            <p className="text-muted small mb-0">{user?.user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: Form chi tiết nằm ngang (9 phần 12) */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 bg-white h-100">
                        <div className="card-header bg-transparent border-0 p-4 pt-5">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h3 className="fw-bold text-dark mb-0">Cài đặt tài khoản</h3>
                                    <p className="text-muted mb-0 small">
                                        Cập nhật thông tin cá nhân của bạn tại đây
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={`btn rounded-pill px-4 py-2 fw-semibold border-0 ${isEditing ? 'btn-light text-danger' : 'text-white'
                                        }`}
                                    style={{
                                        background: isEditing
                                            ? '#ffffff'
                                            : 'linear-gradient(135deg, #198754, #20c997)',
                                        boxShadow: isEditing
                                            ? '0 10px 25px rgba(220,53,69,0.12)'
                                            : '0 12px 25px rgba(25,135,84,0.22)',
                                        transition: 'all 0.25s ease',
                                        letterSpacing: '0.3px',
                                    }}
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? 'Hủy bỏ' : 'Chỉnh sửa thông tin'}
                                </button>
                            </div>
                        </div>

                        <div className="card-body p-4 p-md-5">
                            <form onSubmit={handleUpdate}>
                                <div className="row g-4">
                                    {/* Nhóm Họ và Tên */}
                                    <div className="col-md-6">
                                        <div className="form-floating mb-3">
                                            <input
                                                type="text"
                                                className={`form-control border-0 border-bottom rounded-0 px-0 ${isEditing ? 'border-success' : 'bg-white'}`}
                                                id="fullName"
                                                disabled={!isEditing}
                                                value={formData.full_name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        full_name: e.target.value,
                                                    })
                                                }
                                                placeholder="Họ và tên"
                                            />
                                            <label
                                                htmlFor="fullName"
                                                className="px-0 text-muted fw-bold small"
                                            >
                                                HỌ VÀ TÊN
                                            </label>
                                        </div>
                                    </div>

                                    {/* Nhóm Số điện thoại */}
                                    <div className="col-md-6">
                                        <div className="form-floating mb-3">
                                            <input
                                                type="text"
                                                className={`form-control border-0 border-bottom rounded-0 px-0 ${isEditing ? 'border-success' : 'bg-white'}`}
                                                id="phone"
                                                disabled={!isEditing}
                                                value={formData.phone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phone: e.target.value })
                                                }
                                                placeholder="Số điện thoại"
                                            />
                                            <label
                                                htmlFor="phone"
                                                className="px-0 text-muted fw-bold small"
                                            >
                                                SỐ ĐIỆN THOẠI
                                            </label>
                                        </div>
                                    </div>

                                    {/* Nhóm Email (Full width) */}
                                    <div className="col-12 mt-4">
                                        <div
                                            className="p-4 rounded-4"
                                            style={{
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                            }}
                                        >
                                            <div className="row align-items-center">
                                                <div className="col-sm-2 text-center text-sm-start">
                                                    <i className="bi bi-envelope-paper-fill fs-1 text-muted opacity-50"></i>
                                                </div>
                                                <div className="col-sm-10">
                                                    <label className="d-block small fw-bold text-muted mb-1">
                                                        ĐỊA CHỈ EMAIL ĐĂNG NHẬP
                                                    </label>
                                                    <h5 className="mb-0 fw-bold text-dark">
                                                        {formData.email}
                                                    </h5>
                                                    <p className="mb-0 small text-muted">
                                                        Email là định danh duy nhất và không thể thay đổi.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nút Lưu thay đổi */}
                                    {isEditing && (
                                        <div className="col-12 mt-5 text-end">
                                            <button
                                                type="submit"
                                                className="btn rounded-pill px-4 py-2 fw-semibold border-0 text-white"
                                                style={{
                                                    minWidth: '210px',
                                                    height: '48px',
                                                    background:
                                                        'linear-gradient(135deg, #111827, #374151)',
                                                    boxShadow: '0 12px 25px rgba(17,24,39,0.22)',
                                                    transition: 'all 0.25s ease',
                                                    letterSpacing: '0.3px',
                                                }}
                                            >
                                                Lưu thay đổi
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

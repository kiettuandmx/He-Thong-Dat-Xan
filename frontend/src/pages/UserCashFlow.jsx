import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

// Cấu hình Base URL (Nên đưa vào file .env trong thực tế)
const API_BASE_URL = 'http://localhost:5000/api';

const UserCashFlow = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    
    // State Management
    const [cashFlowData, setCashFlowData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 1. Hàm helper định dạng tiền tệ VND
    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    // 2. Fetch data với useCallback để tránh re-render thừa
    const fetchCashFlow = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const authData = JSON.parse(localStorage.getItem('user'));
            const token = authData?.token;

            if (!token) {
                throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            }

            const res = await axios.get(`${API_BASE_URL}/bookings/cash-flow/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data?.success || res.data?.data) {
                setCashFlowData(res.data.data);
            } else {
                throw new Error('Dữ liệu không hợp lệ từ máy chủ.');
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Lỗi tải dữ liệu dòng tiền.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchCashFlow();
    }, [fetchCashFlow]);

    // 3. Render Helpers
    const getTransactionConfig = (type) => {
        const configs = {
            payment: { icon: 'bi-cash-coin', color: 'text-success', label: 'Thanh toán' },
            booking: { icon: 'bi-calendar-check', color: 'text-primary', label: 'Đặt sân' },
            refund: { icon: 'bi-arrow-counterclockwise', color: 'text-warning', label: 'Hoàn tiền' },
            default: { icon: 'bi-question-circle', color: 'text-muted', label: 'Khác' }
        };
        return configs[type] || configs.default;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            paid: 'bg-success',
            partially_paid: 'bg-warning text-dark',
            unpaid: 'bg-danger',
            refunded: 'bg-info text-dark',
            pending: 'bg-secondary',
            approved: 'bg-success',
            rejected: 'bg-danger',
            cancelled: 'bg-dark',
        };
        const className = statusConfig[status] || 'bg-secondary';
        return <span className={`badge rounded-pill ${className}`}>{status.toUpperCase()}</span>;
    };

    // Màn hình Loading
    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100">
                <div className="spinner-grow text-primary" role="status"></div>
                <p className="mt-3 fw-bold text-primary">Đang truy xuất dữ liệu...</p>
            </div>
        );
    }

    // Màn hình Lỗi
    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger shadow-sm" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
                <button className="btn btn-primary" onClick={() => navigate(-1)}>Quay lại</button>
            </div>
        );
    }

    const { user, transactions, summary } = cashFlowData || {};

    return (
        <div className="container py-4">
            {/* Header Section */}
            <div className="row align-items-center mb-4">
                <div className="col">
                    <h3 className="fw-bold text-dark mb-1">Dòng Tiền Khách Hàng</h3>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item active text-primary fw-semibold">
                                {user?.name} | {user?.phone || 'N/A'}
                            </li>
                        </ol>
                    </nav>
                </div>
                <div className="col-auto">
                    <button className="btn btn-light border shadow-sm" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left me-2"></i>Quay lại
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Tổng thu', value: summary.totalIncome, color: 'success', icon: 'bi-graph-up' },
                    { label: 'Tổng chi', value: summary.totalExpense, color: 'danger', icon: 'bi-graph-down' },
                    { label: 'Số dư ròng', value: summary.netBalance, color: 'primary', icon: 'bi-wallet2' },
                    { label: 'Giao dịch', value: summary.transactionCount, color: 'info', icon: 'bi-receipt', isRaw: true }
                ].map((item, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className={`card border-0 shadow-sm border-start border-${item.color} border-4 h-100`}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted small fw-bold text-uppercase">{item.label}</span>
                                    <i className={`bi ${item.icon} text-${item.color} fs-4`}></i>
                                </div>
                                <h4 className={`fw-bold mb-0 ${item.isRaw ? 'text-dark' : `text-${item.color}`}`}>
                                    {item.isRaw ? item.value : formatVND(item.value)}
                                </h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Transactions Table */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Lịch sử giao dịch</h5>
                        <button className="btn btn-sm btn-outline-primary" onClick={fetchCashFlow}>
                            <i className="bi bi-arrow-clockwise me-1"></i>Làm mới
                        </button>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small text-uppercase">
                            <tr>
                                <th className="ps-4">Loại</th>
                                <th>Chi tiết</th>
                                <th>Số tiền</th>
                                <th>Trạng thái</th>
                                <th>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions?.length > 0 ? transactions.map((t) => {
                                const config = getTransactionConfig(t.type);
                                return (
                                    <tr key={t.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className={`icon-box me-2 ${config.color} bg-light p-2 rounded`}>
                                                    <i className={`bi ${config.icon}`}></i>
                                                </div>
                                                <span className="fw-semibold">{config.label}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark">{t.description}</div>
                                            {t.booking_date && <small className="text-muted d-block">Sân: {new Date(t.booking_date).toLocaleDateString('vi-VN')}</small>}
                                        </td>
                                        <td>
                                            <span className={`fw-bold ${t.amount > 0 ? 'text-success' : 'text-danger'}`}>
                                                {t.amount > 0 ? '+' : ''}{formatVND(t.amount)}
                                            </span>
                                            {t.payment_method && <small className="text-muted d-block">{t.payment_method}</small>}
                                        </td>
                                        <td>{getStatusBadge(t.status)}</td>
                                        <td className="text-muted small">
                                            {new Date(t.date).toLocaleString('vi-VN', { 
                                                dateStyle: 'short', 
                                                timeStyle: 'short' 
                                            })}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <i className="bi bi-inbox fs-1 text-muted opacity-25"></i>
                                        <p className="text-muted mt-2">Chưa có dữ liệu giao dịch.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserCashFlow;
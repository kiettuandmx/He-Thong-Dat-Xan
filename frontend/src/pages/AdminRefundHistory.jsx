import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminRefundHistory = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const backendUrl = 'http://localhost:5000';

    useEffect(() => {
        const fetchAdminRefunds = async () => {
            try {
                const authData = JSON.parse(localStorage.getItem('user'));
                const token = authData?.token;

                if (!token) {
                    throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                }

                const res = await axios.get(`${backendUrl}/api/bookings/admin/refund-history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = res.data.data || res.data;
                setRefunds(Array.isArray(data) ? data : []);
            } catch (err) {
                const message = err.response?.data?.message || err.message || 'Lỗi tải lịch sử hoàn tiền hệ thống.';
                console.error('Lỗi API:', message);
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminRefunds();
    }, []);

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-danger" role="status"></div>
                <p className="mt-2">Đang tải dữ liệu hệ thống...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <h4 className="fw-bold mb-4 text-dark">
                <i className="bi bi-shield-lock me-2"></i>Quản lý hoàn tiền hệ thống
            </h4>
            
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th className="ps-4">Khách hàng</th>
                                <th>Sân vận động</th>
                                <th>Sân nhỏ & Ngày</th>
                                <th>Số tiền hoàn</th>
                                <th>Lý do hoàn</th>
                                <th className="pe-4 text-end">Thời gian hoàn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds.length > 0 ? refunds.map((item) => (
                                <tr key={item.id}>
                                    <td className="ps-4">
                                        <div className="fw-bold">{item.user?.name || 'N/A'}</div>
                                        <small className="text-muted">{item.user?.phone || ''}</small>
                                    </td>
                                    <td>
                                        <span className="badge bg-info text-dark">
                                            {item.field?.stadium?.name || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <div>{item.field?.name || 'N/A'}</div>
                                        <small className="text-muted">{item.booking_date}</small>
                                    </td>
                                    <td className="text-danger fw-bold">
                                        -{Number(item.total_price || 0).toLocaleString()}đ
                                    </td>
                                    <td>
                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                                            {item.refund_reason || 'Hoàn trả hệ thống'}
                                        </span>
                                    </td>
                                    <td className="pe-4 text-end text-muted small">
                                        {item.refunded_at 
                                            ? new Date(item.refunded_at).toLocaleString('vi-VN') 
                                            : new Date(item.updatedAt).toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox display-4 d-block mb-2 opacity-25"></i>
                                        Chưa có lịch sử hoàn tiền nào trên toàn hệ thống.
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

export default AdminRefundHistory;
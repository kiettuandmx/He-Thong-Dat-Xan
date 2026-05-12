import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RefundHistory = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const backendUrl = 'http://localhost:5000';

    useEffect(() => {
        const fetchRefunds = async () => {
            try {
                const authData = JSON.parse(localStorage.getItem('user'));
                const token = authData?.token;

                if (!token) {
                    throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                }

                const res = await axios.get(`${backendUrl}/api/bookings/refund-history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                console.log('Dữ liệu nhận về:', res.data);

                const data = res.data.data || res.data;
                setRefunds(Array.isArray(data) ? data : []);
            } catch (err) {
                const message = err.response?.data?.message || err.message || 'Lỗi tải dữ liệu hoàn tiền.';
                console.error('Lỗi API:', message);
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchRefunds();
    }, []);

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2">Đang tải dữ liệu...</p>
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
        <div className="container mt-4">
            <h4 className="fw-bold mb-4">
                <i className="bi bi-arrow-counterclockwise me-2"></i>Lịch sử hoàn tiền
            </h4>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="ps-4">Khách hàng</th>
                                <th>Sân & Ngày</th>
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
                                        <div>{item.field?.name || item.stadium_name || 'N/A'}</div>
                                        <small className="text-muted">{item.booking_date}</small>
                                    </td>
                                    <td className="text-danger fw-bold">
                                        -{Number(item.total_price || item.amount || 0).toLocaleString()}đ
                                    </td>
                                    <td>
                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                            {item.refund_reason || item.reason || 'Khách yêu cầu'}
                                        </span>
                                    </td>
                                    <td className="pe-4 text-end text-muted small">
                                        {item.refunded_at
                                            ? new Date(item.refunded_at).toLocaleString('vi-VN')
                                            : 'Vừa xong'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">
                                        <i className="bi bi-inbox display-4 d-block mb-2 opacity-25"></i>
                                        Chưa có lịch sử hoàn tiền nào.
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

export default RefundHistory;

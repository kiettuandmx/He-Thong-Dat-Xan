import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import ComplaintModal from '../components/ComplaintModal';
import AccountPageHeader from '../components/AccountPageHeader';
import Swal from 'sweetalert2';

// --- COMPONENT CON: XỬ LÝ TỪNG DÒNG ĐÁNH GIÁ ---
const ReviewItem = ({ rev, onRefresh, getAuthToken }) => {
    const [replyText, setReplyText] = useState(rev.owner_reply || '');
    const [isEditing, setIsEditing] = useState(false);

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        try {
            const token = getAuthToken();
            await axios.patch(`http://localhost:5000/api/reviews/${rev.id}/reply`, 
                { owner_reply: replyText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Gửi phản hồi thành công!',
                timer: 1500,
                showConfirmButton: false
            });
            setIsEditing(false);
            onRefresh();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: err.response?.data?.message || err.message
            });
        }
    };

    return (
        <div className="col-md-6">
            <div className="card border-0 shadow-sm p-3 rounded-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 className="fw-bold mb-0 text-primary">
                            {rev.user?.name || "Khách hàng"} - {rev.field?.name}
                        </h6>
                        <div className="text-warning small mb-2">
                            {'⭐'.repeat(rev.rating)}
                        </div>
                    </div>
                    <small className="text-muted italic">
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </small>
                </div>
                
                <div className="bg-light p-3 rounded-3 mt-1 mb-3">
                    <p className="small text-dark mb-0">"{rev.comment}"</p>
                </div>

                <div className="mt-auto pt-2 border-top">
                    {rev.owner_reply && !isEditing ? (
                        <div className="p-2 bg-success-subtle rounded-3 shadow-sm border border-success-subtle">
                            <small className="fw-bold d-block text-success mb-1">
                                <i className="bi bi-reply-fill"></i> Phản hồi của bạn:
                            </small>
                            <p className="small mb-0 text-dark">"{rev.owner_reply}"</p>
                            <button 
                                className="btn btn-link btn-sm p-0 text-decoration-none mt-1"
                                onClick={() => setIsEditing(true)}
                            >
                                <small>Sửa phản hồi</small>
                            </button>
                        </div>
                    ) : (
                        <div className="input-group input-group-sm">
                            <input 
                                type="text" 
                                className="form-control rounded-start-pill ps-3" 
                                placeholder="Nhập lời phản hồi..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button 
                                className="btn btn-primary rounded-end-pill px-3" 
                                onClick={handleSendReply}
                            >
                                {rev.owner_reply ? "Lưu" : "Gửi"}
                            </button>
                            {isEditing && (
                                <button className="btn btn-light btn-sm ms-1 rounded-pill" onClick={() => setIsEditing(false)}>Hủy</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH: LỊCH SỬ ĐẶT SÂN ---
const BookingHistory = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [complaintBooking, setComplaintBooking] = useState(null);
    
    const roleId = Number(user?.user?.role_id || user?.user?.role);
    const isOwner = roleId === 2;

    const getAuthToken = () => {
        const authData = localStorage.getItem('user');
        if (!authData) return null;
        try {
            const parsedData = JSON.parse(authData);
            return parsedData.token || authData;
        } catch (e) {
            return authData;
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getAuthToken();
            if (!token) {
                setError("Vui lòng đăng nhập để xem lịch sử đặt sân.");
                return;
            }

            const currentUserId = user?.user?.id || user?.id;
            const bookingEndpoint = isOwner
                ? `http://localhost:5000/api/bookings/owner/${currentUserId}`
                : "http://localhost:5000/api/bookings/history";

            const resBooking = await axios.get(bookingEndpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(resBooking.data);

            if (!isOwner) {
                try {
                    const resComplaints = await axios.get('http://localhost:5000/api/complaints/my', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setComplaints(resComplaints.data?.data || []);
                } catch (complaintErr) {
                    console.error("Loi lay danh sach khieu nai:", complaintErr);
                }
            }

            if (isOwner) {
                try {
                    const resReview = await axios.get(`http://localhost:5000/api/reviews/owner`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (resReview.data) setReviews(resReview.data);
                } catch (reviewErr) {
                    console.error("Lỗi lấy danh sách review:", reviewErr);
                }
            }
        } catch (err) {
            console.error("Lỗi lấy dữ liệu tổng quát:", err);
            setError(err.response?.data?.message || "Không thể tải dữ liệu lịch sử.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleApprove = async (bookingId) => {
        try {
            const token = getAuthToken();
            await axios.put(`http://localhost:5000/api/bookings/approve/${bookingId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Thành công', 'Đã duyệt đơn thành công!', 'success');
            fetchHistory();
        } catch (err) {
            Swal.fire('Lỗi', 'Lỗi khi duyệt đơn!', 'error');
        }
    };

    const handleCancel = async (bookingId) => {
        const result = await Swal.fire({
            title: 'Bạn chắc chắn chứ?',
            text: "Bạn muốn hủy đơn đặt sân này?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Quay lại'
        });

        if (result.isConfirmed) {
            try {
                const token = getAuthToken();
                await axios.put(`http://localhost:5000/api/bookings/cancel/${bookingId}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Đã hủy!', 'Đơn hàng đã được hủy.', 'success');
                fetchHistory();
            } catch (error) {
                Swal.fire('Lỗi', error.response?.data?.message || "Không thể hủy đơn.", 'error');
            }
        }
    };

    const handleReject = async (id) => {
        const { value: reason } = await Swal.fire({
            title: 'Lý do từ chối',
            input: 'text',
            inputPlaceholder: 'Nhập lý do của bạn...',
            showCancelButton: true
        });

        if (reason) {
            try {
                const token = getAuthToken();
                await axios.patch(`http://localhost:5000/api/bookings/reject/${id}`, 
                    { reject_reason: reason }, 
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire('Thành công', 'Đã từ chối đơn!', 'success');
                fetchHistory();
            } catch (error) {
                Swal.fire('Lỗi', error.response?.data?.message || "Lỗi khi từ chối", 'error');
            }
        }
    };

    const handleRefund = async (id) => {
        const { value: reason } = await Swal.fire({
            title: 'Lý do hoàn tiền',
            input: 'text',
            inputPlaceholder: 'Nhập lý do hoàn tiền (VD: Khách yêu cầu, sân bảo trì...)',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận hoàn tiền',
            cancelButtonText: 'Hủy'
        });

        if (reason) {
            try {
                const token = getAuthToken();
                await axios.put(`http://localhost:5000/api/bookings/refund/${id}`, 
                    { refund_reason: reason }, 
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire('Thành công', 'Đã hoàn tiền và hủy đơn!', 'success');
                fetchHistory();
            } catch (error) {
                Swal.fire('Lỗi', error.response?.data?.message || "Lỗi khi hoàn tiền", 'error');
            }
        }
    };

    return (
        <div className="account-page">
            <AccountPageHeader
                title={isOwner ? 'Quản lý đơn đặt sân' : 'Lịch sử đặt sân'}
                description={
                    isOwner
                        ? 'Theo dõi các yêu cầu đặt sân, duyệt đơn và xử lý hoàn tiền khi cần.'
                        : 'Xem lại các lượt đặt sân của bạn, trạng thái xử lý và những việc cần làm tiếp theo.'
                }
                action={
                    <button className="secondary-button px-4 py-3" onClick={fetchHistory} type="button">
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                }
            />

            {error && (
                <div className="alert alert-warning rounded-4 shadow-sm mb-4" role="alert">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    {error}
                </div>
            )}

            <div className="row g-3">
                {bookings.length > 0 ? (
                    bookings.map(b => (
                        <div className={`col-12 card border-0 shadow-sm p-3 mb-2 rounded-4 ${b.status === 'cancelled' ? 'opacity-50 bg-light d-none' : ''}`} key={b.id}>
                            <div className="row align-items-center">
                                <div className="col-md-4">
                                    <h6 className="fw-bold mb-1">{b.field?.name || `Sân trống`}</h6>
                                    <div className="small text-muted mb-2">
                                        <div className="mb-1">
                                            <i className="bi bi-calendar-event me-1"></i> Ngày chơi: <strong>{new Date(b.booking_date).toLocaleDateString('vi-VN')}</strong>
                                        </div>
                                        <div className="mb-1">
                                            <i className="bi bi-clock me-1"></i> Giờ chơi: <strong>{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</strong>
                                        </div>
                                        <div className="mb-1 small opacity-75">
                                            <i className="bi bi-info-circle me-1"></i> Đặt lúc: {new Date(b.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                        {!isOwner && (
                                            <div className="mt-2">
                                                <span className={`badge border ${b.payment_type === 'deposit' ? 'text-info border-info' : 'text-success border-success'}`} style={{ fontSize: '0.7rem' }}>
                                                    {b.payment_type === 'deposit' ? '● Đã cọc 50%' : '● Trả hết 100%'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {isOwner && (
                                        <div className="mt-2 border-top pt-2">
                                            <div className="text-primary fw-bold mb-2 small">
                                                <i className="bi bi-person-circle me-1"></i>
                                                Khách: {b.user?.name || 'N/A'} - {b.user?.phone || 'N/A'}
                                            </div>
                                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                                <span className={`badge rounded-pill small ${b.payment_type === 'full' ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'}`}>
                                                    {b.payment_type === 'full' ? '✓ Trả hết' : '○ Đã cọc'}
                                                </span>
                                                <span className={`badge rounded-pill small ${b.payment_status === 'paid' ? 'bg-light text-success border' : 'bg-light text-warning border'}`}>
                                                    {b.payment_status === 'paid' ? '● Tiền đã nhận' : '○ Chờ tiền'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-3">
                                    {/* Để trống hoặc thêm thông tin khác nếu cần */}
                                </div>

                                <div className="col-md-2 text-center">
                                    <div className="text-success fw-bold">
                                        {Number(b.amount_paid).toLocaleString()}đ
                                    </div>
                                    {isOwner && b.payment_type === 'deposit' && (
                                        <small className="text-danger">Thu thêm: {(b.total_price - b.amount_paid).toLocaleString()}đ</small>
                                    )}
                                </div>

                                 <div className="col-md-3 text-end">
                                    <span className={`badge px-3 py-2 rounded-pill mb-1 shadow-sm ${
                                        b.status === 'confirmed' ? 'bg-success' : 
                                        b.status === 'rejected' ? 'bg-danger' : 
                                        b.status === 'refunded' ? 'bg-info' : 
                                        'bg-warning text-dark'
                                    }`}>
                                        {b.status === 'confirmed' ? '✓ Đã duyệt' : 
                                         b.status === 'rejected' ? '✕ Từ chối' : 
                                         b.status === 'refunded' ? '↺ Đã hoàn tiền' : 
                                         '⌛ Chờ duyệt'}
                                    </span>

                                    <div className="mt-2">
                                        {!isOwner && b.status === 'confirmed' && !b.review && (
                                            <button className="btn btn-sm btn-warning rounded-pill px-3 shadow-sm" onClick={() => { setSelectedBookingId(b.id); setShowModal(true); }}>
                                                Đánh giá
                                            </button>
                                        )}

                                        {!isOwner && ['confirmed', 'rejected', 'refunded'].includes(b.status) && (
                                            (() => {
                                                const existingComplaint = complaints.find((c) => Number(c.booking_id) === Number(b.id));
                                                return existingComplaint ? (
                                                    <div className="mt-2">
                                                        <span className="badge bg-danger-subtle text-danger border">
                                                            Khiếu nại: {existingComplaint.status}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger rounded-pill px-3 mt-2"
                                                        onClick={() => setComplaintBooking(b)}
                                                    >
                                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                                        Khiếu nại
                                                    </button>
                                                );
                                            })()
                                        )}

                                        {isOwner && b.status === 'pending' && (
                                            <div className="d-flex gap-2 justify-content-end mt-2">
                                                <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={() => handleApprove(b.id)}>Duyệt</button>
                                                <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleReject(b.id)}>Từ chối</button>
                                            </div>
                                        )}

                                        {isOwner && b.status === 'confirmed' && (
                                            <div className="d-flex gap-2 justify-content-end mt-2">
                                                <button className="btn btn-sm btn-outline-info rounded-pill px-3" onClick={() => handleRefund(b.id)}>
                                                    <i className="bi bi-arrow-counterclockwise"></i> Hoàn tiền
                                                </button>
                                            </div>
                                        )}
                                        
                                        {!isOwner && b.status === 'pending' && (
                                            <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleCancel(b.id)}>Hủy đơn</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="account-empty-state w-100">
                        <p className="text-muted mb-0">{isOwner ? "Chưa có đơn hàng nào." : "Bạn chưa có lịch sử đặt sân nào."}</p>
                    </div>
                )}
            </div>

            {isOwner && (
                <div className="mt-5 pt-4 border-top">
                    <h4 className="fw-bold mb-4">Đánh giá và phản hồi</h4>
                    <div className="row g-3">
                        {reviews.length > 0 ? (
                            reviews.map(rev => (
                                <ReviewItem key={rev.id} rev={rev} onRefresh={fetchHistory} getAuthToken={getAuthToken} />
                            ))
                        ) : (
                            <div className="text-muted ps-3 italic">Chưa có đánh giá nào.</div>
                        )}
                    </div>
                </div>
            )}

            {showModal && (
                <ReviewModal
                    bookingId={selectedBookingId}
                    onClose={() => setShowModal(false)}
                    onRefresh={fetchHistory}
                />
            )}

            {complaintBooking && (
                <ComplaintModal
                    booking={complaintBooking}
                    onClose={() => setComplaintBooking(null)}
                    onSuccess={fetchHistory}
                />
            )}
        </div>
    );
};

export default BookingHistory;

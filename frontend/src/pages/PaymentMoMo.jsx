import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const PaymentMoMo = () => {
    const { bookingId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);

    // Lấy dữ liệu từ state đã truyền qua từ trang đặt sân
    const { amount: stateAmount, description: stateDescription } = location.state || {};

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const authData = JSON.parse(localStorage.getItem('user'));
                const res = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`, {
                    headers: { Authorization: `Bearer ${authData?.token}` }
                });
                
                const data = res.data.data;
                setBookingData(data);

                // Tính toán thời gian giữ chỗ còn lại
                if (data.hold_until && data.status === 'pending' && data.payment_status === 'unpaid') {
                    const holdTime = new Date(data.hold_until).getTime();
                    const now = new Date().getTime();
                    const diff = Math.floor((holdTime - now) / 1000);
                    
                    if (diff > 0) {
                        setTimeLeft(diff);
                    } else {
                        setTimeLeft(0);
                    }
                }
            } catch (error) {
                console.error("Lỗi fetch đơn hàng:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingDetails();
    }, [bookingId]);

    // Timer effect
    useEffect(() => {
        if (timeLeft === null) return;
        
        if (timeLeft <= 0) {
            Swal.fire("Hết giờ!", "Thời gian giữ chỗ đã hết! Hệ thống đã hủy đơn của bạn.", "error")
            .then(() => navigate('/history'));
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, navigate]);

    // Format thời gian hiển thị (MM:SS)
    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const amount = bookingData?.amount_paid || stateAmount || 0;
    const description = stateDescription || `Thanh toan san ${bookingData?.field?.name || ''}`;

    const handleConfirm = async () => {
        try {
            const authData = JSON.parse(localStorage.getItem('user'));
            const token = authData?.token;

            await axios.put(`http://localhost:5000/api/bookings/update-payment/${bookingId}`, 
                { 
                    payment_status: 'paid',
                    payment_method: 'MoMo' 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire("Thành công", "Xác nhận thanh toán thành công! Vui lòng chờ chủ sân duyệt.", "success")
            .then(() => navigate('/history'));
        } catch (error) {
            console.error("Lỗi xác nhận:", error);
            Swal.fire("Lỗi", "Có lỗi xảy ra khi xác nhận thanh toán.", "error");
        }
    };

    const handlePayLater = () => {
        Swal.fire({
            title: "Lưu ý",
            text: "Bạn cần thanh toán trước hoặc 50% để hoàn tất đặt sân này!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Đồng ý",
            cancelButtonText: "Ở lại",
            confirmButtonColor: "#198754",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const authData = JSON.parse(localStorage.getItem('user'));
                    const token = authData?.token;
                    
                    await axios.put(`http://localhost:5000/api/bookings/cancel/${bookingId}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (bookingData?.field_id) {
                        navigate(`/field/${bookingData.field_id}`);
                    } else {
                        navigate(-1);
                    }
                } catch (error) {
                    console.error("Lỗi khi hủy đơn hàng:", error);
                    navigate(-1);
                }
            }
        });
    };

    // Lấy thông tin chủ sân
    const owner = bookingData?.field?.stadium?.owner;
    const myPhone = owner?.phone || '0901234567';
    const ownerName = owner?.name || "VO DUONG HONG LAM";

    // Link tạo mã QR MoMo - Sử dụng format tối giản nhất để tăng độ tương thích
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${myPhone}|||0|0|${amount}`;

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        Swal.fire({
            title: "Đã sao chép",
            text: `Đã sao chép ${label} vào bộ nhớ tạm.`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });
    };

    if (loading) return <div className="text-center mt-5">Đang tải thông tin thanh toán...</div>;

    return (
        <div className="container mt-5 text-center">
            <div
                className="card shadow-lg border-0 rounded-4 p-4 mx-auto"
                style={{ maxWidth: '450px' }}
            >
                <div className="text-center mb-3">
                    <h4 className="fw-bold mb-1">Thanh toán qua ví MoMo</h4>
                    <p className="text-muted small mb-2">Đơn hàng: <strong>#{bookingId}</strong></p>
                    <div className="badge bg-danger text-white p-2 w-100 rounded-3 mb-2" style={{ whiteSpace: 'normal' }}>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Vui lòng sử dụng <strong>App MoMo</strong> để quét mã.
                    </div>
                </div>

                {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
                {timeLeft !== null && (
                    <div className="alert alert-warning py-2 mb-3">
                        <i className="bi bi-clock-history me-2"></i>
                        Thời gian giữ chỗ: <strong className="fs-5 text-danger">{formatTime(timeLeft)}</strong>
                    </div>
                )}

                <div className="bg-light p-3 rounded-4 mb-3 position-relative">
                    <img
                        src={qrUrl}
                        alt="MoMo QR"
                        className="img-fluid rounded-3 shadow-sm"
                    />
                    <div className="mt-2 small text-muted">Mã QR tự động điền số tiền</div>
                </div>

                <div className="bg-light p-3 rounded-4 mb-4 text-start">
                    <p className="fw-bold mb-2 small text-uppercase">Thông tin chuyển khoản</p>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <span className="small text-muted d-block">Số điện thoại</span>
                            <span className="fw-bold">{myPhone}</span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleCopy(myPhone, "số điện thoại")}>
                            <i className="bi bi-copy"></i>
                        </button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <span className="small text-muted d-block">Số tiền</span>
                            <span className="fw-bold text-danger">{Number(amount).toLocaleString()}đ</span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleCopy(amount, "số tiền")}>
                            <i className="bi bi-copy"></i>
                        </button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <span className="small text-muted d-block">Nội dung</span>
                            <span className="fw-bold text-primary">{description} ID {bookingId}</span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleCopy(`${description} ID ${bookingId}`, "nội dung")}>
                            <i className="bi bi-copy"></i>
                        </button>
                    </div>
                </div>

                <button
                    className="btn btn-primary w-100 rounded-pill py-2 fw-bold mb-2 shadow-sm"
                    onClick={handleConfirm}
                >
                    Tôi đã chuyển khoản xong
                </button>

                <button
                    className="btn btn-outline-secondary w-100 rounded-pill py-2"
                    onClick={handlePayLater}
                >
                    Thanh toán sau
                </button>
            </div>
        </div>
    );
};

export default PaymentMoMo;

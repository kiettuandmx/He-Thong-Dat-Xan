import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null); // Thời gian còn lại (giây)

    // Lấy thông tin từ state (nếu có) để hiện nhanh
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
            alert("Thời gian giữ chỗ đã hết! Hệ thống đã hủy đơn của bạn.");
            navigate('/history');
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

    // Ưu tiên dữ liệu từ Database, nếu chưa có thì dùng từ state
    const amount = bookingData?.amount_paid || stateAmount || 0;
    const description = stateDescription || `Thanh toan san ${bookingData?.field?.name || ''}`;
    
    // Thông tin ngân hàng của chủ sân
    const ownerBank = bookingData?.field?.stadium?.owner;
    const BANK_ID = ownerBank?.bank_name || "MB"; 
    const ACCOUNT_NO = ownerBank?.bank_account || "0901234567";
    const ACCOUNT_NAME = ownerBank?.name || "VO DUONG HONG LAM";
    
    const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(description + " ID " + bookingId)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    const handleConfirm = async () => {
        try {
            const authData = JSON.parse(localStorage.getItem('user'));
            const token = authData?.token;

            // Gọi API cập nhật trạng thái đã thanh toán
            await axios.put(`http://localhost:5000/api/bookings/update-payment/${bookingId}`, 
                { 
                    payment_status: 'paid',
                    payment_method: 'VNPay/Chuyển khoản' 
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
                    
                    // Gọi API để hủy đơn hàng hiện tại, giải phóng khung giờ
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
                    // Vẫn chuyển hướng dù có lỗi hủy để người dùng không bị kẹt
                    navigate(-1);
                }
            }
        });
    };

    if (loading) return <div className="text-center mt-5">Đang tải thông tin thanh toán...</div>;

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow-sm border-0 rounded-4 p-4 text-center">
                        <h4 className="fw-bold mb-1">Quét mã thanh toán</h4>
                        <p className="text-muted small mb-3">Đơn hàng #{bookingId}</p>
                        <div className="alert alert-info py-2 small mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            Sử dụng <strong>App Ngân hàng</strong> hoặc <strong>MoMo</strong> để quét mã VietQR này.
                        </div>

                        {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
                        {timeLeft !== null && (
                            <div className="alert alert-warning py-2 mb-3">
                                <i className="bi bi-clock-history me-2"></i>
                                Thời gian giữ chỗ: <strong className="fs-5 text-danger">{formatTime(timeLeft)}</strong>
                            </div>
                        )}
                        
                        <div className="bg-light p-3 rounded-4 mb-3">
                            <img src={qrUrl} alt="QR Code" className="img-fluid" style={{ maxHeight: '300px' }} />
                        </div>

                        <div className="text-start mb-4">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Số tiền:</span>
                                <span className="fw-bold text-danger">{Number(amount).toLocaleString()}đ</span>
                            </div>
                            <div className="d-flex justify-content-between small">
                                <span>Nội dung:</span>
                                <span className="text-primary">{description} ID {bookingId}</span>
                            </div>
                        </div>

                        <button className="btn btn-success w-100 rounded-pill py-2 mb-2" onClick={handleConfirm}>
                            Tôi đã chuyển khoản thành công
                        </button>
                        
                        <button className="btn btn-outline-secondary w-100 rounded-pill py-2" onClick={handlePayLater}>
                            Thanh toán sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
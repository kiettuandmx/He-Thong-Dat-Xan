import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  getBrowseFieldsPathByRole,
  getHistoryPathByRole,
  getStoredAuthData,
} from '../utils/authHelpers';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null); // Thời gian còn lại (giây)
    const hasShownSuccessModalRef = useRef(false);

    // Lấy thông tin từ state (nếu có) để hiện nhanh
    const { amount: stateAmount, description: stateDescription } = location.state || {};

    const fetchBookingDetails = useCallback(async () => {
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
            } else {
                setTimeLeft(null);
            }

            return data;
        } catch (error) {
            console.error("Lỗi fetch đơn hàng:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBookingDetails().catch(() => {});
    }, [fetchBookingDetails]);

    // Timer effect
    useEffect(() => {
        if (timeLeft === null) return;
        
        if (timeLeft <= 0) {
            alert("Thời gian giữ chỗ đã hết! Hệ thống đã hủy đơn của bạn.");
            navigate(getHistoryPathByRole(getStoredAuthData()));
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, navigate]);

    const isConfirmedByBank = useMemo(() => {
        return (
            bookingData?.status === 'confirmed' &&
            ['partially_paid', 'paid'].includes(bookingData?.payment_status)
        );
    }, [bookingData]);

    useEffect(() => {
        if (!bookingData || isConfirmedByBank) {
            return undefined;
        }

        const stopStatuses = ['cancelled', 'expired', 'refunded', 'rejected'];
        if (stopStatuses.includes(bookingData.status)) {
            return undefined;
        }

        const intervalId = setInterval(() => {
            fetchBookingDetails().catch(() => {});
        }, 5000);

        return () => clearInterval(intervalId);
    }, [bookingData, fetchBookingDetails, isConfirmedByBank]);

    useEffect(() => {
        if (!isConfirmedByBank || hasShownSuccessModalRef.current) {
            return;
        }

        hasShownSuccessModalRef.current = true;

        Swal.fire({
            title: 'Thanh toán thành công',
            text:
                bookingData?.payment_status === 'partially_paid'
                    ? 'Hệ thống đã xác nhận thanh toán cọc 50%. Nhấn OK để xem lịch sử đặt sân.'
                    : 'Hệ thống đã xác nhận thanh toán thành công. Nhấn OK để xem lịch sử đặt sân.',
            icon: 'success',
            confirmButtonText: 'OK',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonColor: '#198754',
        }).then(() => {
            navigate(getHistoryPathByRole(getStoredAuthData()));
        });
    }, [bookingData?.payment_status, isConfirmedByBank, navigate]);

    // Format thời gian hiển thị (MM:SS)
    const formatTime = (seconds) => {
        if (seconds === null) return "--:--";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Ưu tiên dữ liệu từ Database, nếu chưa có thì dùng từ state
    const amount = bookingData?.amount_paid || stateAmount || 0;
    const paymentReference = bookingData?.payment_reference || stateDescription || `BK${bookingId}`;
    
    // Thông tin ngân hàng của chủ sân
    const ownerBank = bookingData?.field?.stadium?.owner;
    const BANK_ID = ownerBank?.bank_name ? String(ownerBank.bank_name).trim() : '';
    const ACCOUNT_NO = ownerBank?.bank_account ? String(ownerBank.bank_account).trim() : '';
    const ACCOUNT_NAME = ownerBank?.name ? String(ownerBank.name).trim() : '';
    const hasOwnerBankAccount = Boolean(BANK_ID && ACCOUNT_NO && ACCOUNT_NAME);
    
    const qrUrl = hasOwnerBankAccount
        ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(paymentReference)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
        : null;

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
                        navigate(
                          location.pathname.startsWith('/admin/')
                            ? `/admin/field/${bookingData.field_id}`
                            : `/field/${bookingData.field_id}`
                        );
                    } else {
                        navigate(getBrowseFieldsPathByRole(getStoredAuthData()));
                    }
                } catch (error) {
                    console.error("Lỗi khi hủy đơn hàng:", error);
                    // Vẫn chuyển hướng dù có lỗi hủy để người dùng không bị kẹt
                    navigate(getBrowseFieldsPathByRole(getStoredAuthData()));
                }
            }
        });
    };

    if (loading) return <div className="text-center mt-5">Đang tải thông tin thanh toán...</div>;

    const paymentStatusMessage = isConfirmedByBank
        ? bookingData?.payment_status === 'partially_paid'
            ? 'Hệ thống đã xác nhận thanh toán cọc 50% thành công.'
            : 'Hệ thống đã xác nhận thanh toán thành công.'
        : 'Hệ thống sẽ tự động xác nhận sau khi ngân hàng ghi nhận đúng giao dịch.';

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow-sm border-0 rounded-4 p-4 text-center">
                        <h4 className="fw-bold mb-1">Quét mã thanh toán</h4>
                        <p className="text-muted small mb-3">Đơn hàng #{bookingId}</p>
                        <div className="alert alert-info py-2 small mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            Sử dụng <strong>App Ngân hàng</strong> để quét mã VietQR này. Hệ thống sẽ tự động xác nhận sau khi ngân hàng ghi nhận đúng giao dịch.
                        </div>

                        {!hasOwnerBankAccount && (
                            <div className="alert alert-warning py-2 small mb-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Chủ sân này chưa cập nhật thông tin tài khoản nhận tiền. Vui lòng liên hệ chủ sân hoặc chọn sân khác.
                            </div>
                        )}

                        {isConfirmedByBank && (
                            <div className="alert alert-success py-2 small mb-3">
                                <i className="bi bi-check-circle me-2"></i>
                                {paymentStatusMessage}
                            </div>
                        )}

                        {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
                        {timeLeft !== null && (
                            <div className="alert alert-warning py-2 mb-3">
                                <i className="bi bi-clock-history me-2"></i>
                                Thời gian giữ chỗ: <strong className="fs-5 text-danger">{formatTime(timeLeft)}</strong>
                            </div>
                        )}
                        
                        {hasOwnerBankAccount && (
                            <div className="bg-light p-3 rounded-4 mb-3">
                                <img src={qrUrl} alt="QR Code" className="img-fluid" style={{ maxHeight: '300px' }} />
                            </div>
                        )}

                        <div className="text-start mb-4">
                            <div className="d-flex justify-content-between mb-2 small">
                                <span>Ngân hàng nhận:</span>
                                <span className={hasOwnerBankAccount ? 'text-dark' : 'text-danger'}>
                                    {hasOwnerBankAccount ? BANK_ID : 'Chưa cấu hình'}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 small">
                                <span>Số tài khoản:</span>
                                <span className={hasOwnerBankAccount ? 'text-dark' : 'text-danger'}>
                                    {hasOwnerBankAccount ? ACCOUNT_NO : 'Chưa cấu hình'}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 small">
                                <span>Chủ tài khoản:</span>
                                <span className={hasOwnerBankAccount ? 'text-dark' : 'text-danger'}>
                                    {hasOwnerBankAccount ? ACCOUNT_NAME : 'Chưa cấu hình'}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Số tiền:</span>
                                <span className="fw-bold text-danger">{Number(amount).toLocaleString()}đ</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 small">
                                <span>Nội dung:</span>
                                <span className="text-primary">{paymentReference}</span>
                            </div>
                            <div className={`small ${isConfirmedByBank ? 'text-success' : 'text-muted'}`}>
                                {paymentStatusMessage}
                            </div>
                        </div>

                        {!isConfirmedByBank && hasOwnerBankAccount && (
                            <button className="btn btn-outline-primary w-100 rounded-pill py-2 mb-2" type="button" disabled>
                                Đang chờ ngân hàng xác nhận giao dịch
                            </button>
                        )}
                        
                        {!isConfirmedByBank && hasOwnerBankAccount && (
                            <button className="btn btn-outline-secondary w-100 rounded-pill py-2" onClick={handlePayLater}>
                                Thanh toán sau
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;

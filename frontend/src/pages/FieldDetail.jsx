import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const FieldDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('vnpay'); // Mặc định chọn VNPay
  const [field, setField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [payOption, setPayOption] = useState('full');
  const [lockedSlots, setLockedSlots] = useState([]); // Array of strings like "YYYY-MM-DD|HH:mm:ss"
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const timeSlots = [
    { id: 1, time: '05:00 - 06:00', start: '05:00', end: '06:00' },
    { id: 2, time: '06:00 - 07:00', start: '06:00', end: '07:00' },
    { id: 3, time: '07:00 - 08:00', start: '07:00', end: '08:00' },
    { id: 4, time: '17:00 - 18:00', start: '17:00', end: '18:00' },
    { id: 5, time: '18:00 - 19:00', start: '18:00', end: '19:00' },
    { id: 6, time: '19:00 - 20:00', start: '19:00', end: '20:00' },
    { id: 7, time: '20:00 - 21:00', start: '20:00', end: '21:00' },
    { id: 8, time: '21:00 - 22:00', start: '21:00', end: '22:00' },
  ];

  // Socket effect cho việc lắng nghe Realtime Lock
  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    // Lấy thông tin user hiện tại để so sánh
    const authData = localStorage.getItem('user');
    let currentUserId = null;
    if (authData) {
      try {
        currentUserId = JSON.parse(authData).user?.id;
      } catch (err) {
        // Ignore parsing errors
      }
    }
    
    socket.on('slotLocked', (data) => {
      // data: { field_id, date, start_time, locked_by_user }
      if (data.field_id === Number(id)) {
        const slotKey = `${data.date}|${data.start_time}`;
        setLockedSlots(prev => [...prev, slotKey]);
        // Tự động bỏ chọn nếu user đang chọn slot bị lock
        setSelectedSlot(prevSlotId => {
           const lockedSlotInfo = timeSlots.find(s => s.start === data.start_time.substring(0,5));
           if (lockedSlotInfo && lockedSlotInfo.id === prevSlotId && data.date === selectedDate) {
               // Bỏ qua alert và không bỏ chọn nếu chính user hiện tại là người khóa
               if (data.locked_by_user && data.locked_by_user === currentUserId) {
                   return prevSlotId;
               }
               alert("Sân vừa được người khác đặt giữ chỗ, vui lòng chọn giờ khác!");
               return null;
           }
           return prevSlotId;
        });
      }
    });

    socket.on('slotReleased', (data) => {
      if (data.field_id === Number(id)) {
        const slotKey = `${data.date}|${data.start_time}`;
        setLockedSlots(prev => prev.filter(key => key !== slotKey));
      }
    });

    socket.on('slotConfirmed', (data) => {
      if (data.field_id === Number(id)) {
        // Cập nhật lại thông tin sân từ server
        fetchFieldDetail(); 
      }
    });

    return () => socket.disconnect();
  }, [id, selectedDate]);

  // Hàm kiểm tra xem một khung giờ có bận hoặc đã qua thời gian không
  const isSlotBooked = (slot) => {
    if (!field) return false;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // 1. Kiểm tra nếu là ngày trong quá khứ
    if (selectedDate < today) return true;

    // 2. Kiểm tra nếu là ngày hôm nay và khung giờ đã qua
    if (selectedDate === today) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const [slotHour, slotMinute] = slot.start.split(':').map(Number);
        
        // Nếu giờ của slot nhỏ hơn giờ hiện tại, hoặc bằng giờ hiện tại nhưng phút đã qua
        if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
            return true;
        }
    }

    // 3. Kiểm tra realtime lock list
    const isLocked = lockedSlots.some(key => {
        const [lockDate, lockTime] = key.split('|');
        return lockDate === selectedDate && lockTime.substring(0, 5) === slot.start;
    });
    if (isLocked) return true;

    // 4. Kiểm tra trong danh sách schedules (Lịch do chủ sân cài đặt)
    const inSchedules = field.schedules?.some((sch) => {
      const schDate = sch.date.split('T')[0];
      const schStart = sch.start_time.substring(0, 5);
      return (
        schDate === selectedDate &&
        schStart === slot.start &&
        sch.is_available === false
      );
    });

    if (inSchedules) return true;

    // 5. Kiểm tra trong danh sách bookings (Đơn hàng thực tế của người dùng)
    const inBookings = field.bookings?.some((bk) => {
      // Chỉ tính các booking chưa bị cancel/expired/refunded
      if (['cancelled', 'expired', 'refunded'].includes(bk.status)) return false;

      // So sánh ngày
      const bkDate = bk.booking_date; // DATEONLY nên là "YYYY-MM-DD"
      // So sánh giờ (bk.start_time thường là "HH:mm:ss")
      const bkStart = bk.start_time.substring(0, 5);

      return bkDate === selectedDate && bkStart === slot.start;
    });

    return inBookings;
  };

  const fetchFieldDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/fields/${id}`);
      setField(res.data);
    } catch (err) {
      console.error('Lỗi fetch chi tiết sân:', err);
      setError(err.response?.data?.error || 'Không thể tải thông tin sân. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    if (!user) {
      setCouponError('Vui lòng đăng nhập để sử dụng mã giảm giá');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/coupons/validate', {
        code: couponCode,
        user_id: user.id,
        total_price: field?.price_per_hour || 0
      });

      if (res.data.valid) {
        setCouponDiscount(res.data.discount_amount);
        setCouponError('');
        alert(`Mã giảm giá hợp lệ! Giảm ${res.data.discount_amount.toLocaleString()} VND`);
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setCouponDiscount(0);
    }
  };

  useEffect(() => {
    fetchFieldDetail();
  }, [id]);

  useEffect(() => {
    // Reset coupon khi thay đổi field hoặc date
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
  }, [id, selectedDate]);


  const handleBooking = async () => {
    // 1. Lấy thông tin xác thực
    const authData = localStorage.getItem('user');
    let token = null;
    let userId = null;

    if (authData) {
      try {
        const parsedData = JSON.parse(authData);
        token = parsedData.token;
        userId = parsedData.user?.id;
      } catch (err) {
        console.error('Lỗi phân tích dữ liệu xác thực:', err);
        token = authData;
      }
    }

    if (!token || !userId) {
      alert('Vui lòng đăng nhập để đặt sân!');
      return;
    }

    // 2. Kiểm tra khung giờ
    const selectedSlotData = timeSlots.find((s) => s.id === selectedSlot);
    if (!selectedSlotData) {
      alert('Vui lòng chọn khung giờ!');
      return;
    }

    // 3. Tính toán tiền bạc - QUAN TRỌNG: Lam kiểm tra biến payOption
    // Đảm bảo payOption chỉ nhận giá trị 'deposit' hoặc 'full'
    const totalPrice = Number(field.price_per_hour) - couponDiscount;
    const isDeposit = payOption === 'deposit';
    const amountToPay = isDeposit ? totalPrice * 0.5 : totalPrice;

    const bookingData = {
      user_id: userId,
      field_id: field.id,
      stadium_id: field.stadium_id,
      booking_date: selectedDate,
      start_time: selectedSlotData.start,
      end_time: selectedSlotData.end,
      total_price: totalPrice,
      amount_paid: amountToPay, // Gửi số tiền thực tế khách TRẢ LÚC NÀY
      payment_type: payOption, // Gửi 'deposit' hoặc 'full'
      payment_method: paymentMethod,
      status: 'pending',
      coupon_code: couponCode || null,
    };

    // DEBUG: Lam check console xem bookingData gửi đi có đúng payment_type chưa nhé
    console.log('Dữ liệu gửi lên:', bookingData);

    try {
      // 4. Gửi yêu cầu tạo đơn
      const res = await axios.post(
        'http://localhost:5000/api/bookings/book',
        bookingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 5. Xử lý kết quả trả về
      // Dựa trên Response Lam gửi nãy: res.data.data.id
      const responseData = res.data.data;
      const bookingId = responseData?.id;

      if (bookingId) {
        // SỬA: Dùng dấu backtick ` để bọc chuỗi có biến ${}
        const targetPath =
          paymentMethod === 'vnpay'
            ? `/payment-vnpay/${bookingId}`
            : `/payment-momo/${bookingId}`;

        navigate(targetPath, {
          state: {
            amount: amountToPay,
            bookingId: bookingId,
            // SỬA: Dùng dấu backtick cho description luôn
            description: isDeposit
              ? `Coc 50% san ${field.name}`
              : `Thanh toan san ${field.name}`,
          },
        });
      } else {
        alert('Đặt sân thành công!');
        navigate('/history');
      }
    } catch (err) {
      console.error('Lỗi đặt sân:', err);
      alert(err.response?.data?.message || 'Đặt sân thất bại!');
    }
  };
  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p className="mt-3 text-muted">Đang tải thông tin sân...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger shadow-sm rounded-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <div className="mt-3">
            <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}>
              Thử lại
            </button>
            <button className="btn btn-link btn-sm ms-2" onClick={() => navigate('/')}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!field) return null;

  return (
    <div
      className="container py-5"
      style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}
    >
      <div className="row g-5">
        {/* CỘT TRÁI: HÌNH ẢNH & ĐÁNH GIÁ (7 phần) */}
        <div className="col-lg-7">
          <div className="sticky-top" style={{ top: '20px', zIndex: 1 }}>
            <img
              src={(() => {
                const imgUrl = field.images?.[0]?.image_url;
                if (!imgUrl)
                  return 'https://via.placeholder.com/800x500?text=No+Image';
                return imgUrl.startsWith('http')
                  ? imgUrl
                  : `http://localhost:5000/uploads/${imgUrl}`;
              })()}
              className="w-100 rounded-4 shadow-sm mb-4"
              alt={field.name}
              style={{ height: '480px', objectFit: 'cover' }}
            />

            <div className="d-none d-lg-block mt-5">
              <h3 className="fw-bold mb-4">Đánh giá từ khách hàng</h3>
              {(field.reviews && field.reviews.length > 0) ? (
                <div className="row g-3">
                  {field.reviews.map((rev) => (
                    <div key={rev.id} className="col-12">
                      <div className="bg-white p-3 rounded-4 shadow-sm border">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-primary">
                            {rev.user?.name || `Khách hàng #${rev.user_id}`}
                          </span>
                          <span className="text-warning">
                            {'★'.repeat(rev.rating)}
                            {'☆'.repeat(5 - rev.rating)}
                          </span>
                        </div>
                        <p className="text-secondary mb-1">{rev.comment}</p>
                        <small className="text-muted">
                          {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                        </small>

                        {/* Hiển thị phản hồi của chủ sân nếu có */}
                        {rev.owner_reply && (
                          <div className="mt-3 p-2 bg-light rounded-3 border-start border-primary border-4 shadow-sm">
                            <small className="fw-bold text-primary d-block mb-1">
                              <i className="bi bi-reply-all-fill me-1"></i>Phản hồi từ chủ sân:
                            </small>
                            <p className="small mb-0 text-dark italic">"{rev.owner_reply}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-4 border text-center text-muted">
                  <i className="bi bi-chat-dots fs-1 d-block mb-2"></i>
                  Chưa có đánh giá nào cho sân này.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN VÀ FORM ĐẶT SÂN (5 phần) */}
        <div className="col-lg-5">
          <div className="bg-white p-4 rounded-4 border shadow-sm h-100">
            <h2 className="fw-bold mb-1">{field.name}</h2>
            <p className="text-muted mb-4">
              <i className="bi bi-geo-alt-fill me-2"></i>TP. Hồ Chí Minh
            </p>

            <hr className="my-4 opacity-50" />

            {/* 1. Chọn ngày */}
            <div className="mb-4">
              <label className="fw-bold small text-muted text-uppercase mb-2 d-block">
                1. Chọn ngày đặt
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-calendar3"></i>
                </span>
                <input
                  type="date"
                  className="form-control form-control-lg bg-light border-start-0"
                  value={selectedDate}
                  min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Chọn khung giờ */}
            <div className="mb-4">
              <label className="fw-bold small text-muted text-uppercase mb-2 d-block">
                2. Chọn khung giờ
              </label>
              <div className="row g-2">
                {timeSlots.map((slot) => (
                  <div className="col-6" key={slot.id}>
                    <button
                      className={`btn w-100 py-2 fw-semibold transition-all ${selectedSlot === slot.id ? 'btn-success shadow' : 'btn-outline-success'}`}
                      disabled={isSlotBooked(slot)}
                      onClick={() => setSelectedSlot(slot.id)}
                    >
                      {slot.time}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Hình thức thanh toán */}
            <div className="mb-4">
              <label className="fw-bold small text-muted text-uppercase mb-2 d-block">
                3. Hình thức thanh toán
              </label>
              <div
                className={`p-3 border rounded-4 mb-2 cursor-pointer ${payOption === 'full' ? 'border-success bg-success-subtle' : ''}`}
                onClick={() => setPayOption('full')}
              >
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    checked={payOption === 'full'}
                    readOnly
                  />
                  <label className="form-check-label fw-medium">
                    Thanh toán 100% (
                    {(Number(field.price_per_hour) - couponDiscount).toLocaleString()}đ
                    {couponDiscount > 0 && <span className="text-decoration-line-through text-muted ms-1">{Number(field.price_per_hour).toLocaleString()}đ</span>})
                  </label>
                </div>
              </div>
              <div
                className={`p-3 border rounded-4 ${payOption === 'deposit' ? 'border-success bg-success-subtle' : ''}`}
                onClick={() => setPayOption('deposit')}
              >
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    checked={payOption === 'deposit'}
                    readOnly
                  />
                  <label className="form-check-label fw-medium">
                    Đặt cọc 50% ({((field.price_per_hour - couponDiscount) * 0.5).toLocaleString()}
                    đ
                    {couponDiscount > 0 && <span className="text-decoration-line-through text-muted ms-1">{(field.price_per_hour * 0.5).toLocaleString()}đ</span>})
                  </label>
                </div>
              </div>
            </div>

            {/* 3.5. Mã giảm giá */}
            <div className="mb-4">
              <label className="fw-bold small text-muted text-uppercase mb-2 d-block">
                Mã giảm giá (tùy chọn)
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập mã giảm giá"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={validateCoupon}
                >
                  Áp dụng
                </button>
              </div>
              {couponError && <div className="text-danger small mt-1">{couponError}</div>}
              {couponDiscount > 0 && (
                <div className="text-success small mt-1">
                  Giảm {couponDiscount.toLocaleString()}đ
                </div>
              )}
            </div>

            {/* 4. Cổng thanh toán */}
            <div className="mb-5">
              <label className="fw-bold small text-muted text-uppercase mb-3 d-block">
                4. Chọn cổng thanh toán
              </label>
              <div className="row g-3">
                <div className="col-6">
                  <div
                    className={`p-3 border rounded-4 text-center cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-primary bg-primary-subtle ring-2' : 'bg-light'}`}
                    onClick={() => setPaymentMethod('vnpay')}
                  >
                    <img
                      src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg"
                      alt="VNPay"
                      height="20"
                      className="mb-1"
                    />
                    <div className="small fw-bold text-primary">VNPay</div>
                  </div>
                </div>
                {/*MoMo*/}
                <div className="col-6">
                  <div
                    className={`p-3 border rounded-4 text-center cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-danger bg-danger-subtle' : 'bg-light'}`}
                    onClick={() => setPaymentMethod('momo')}
                  >
                    <img
                      src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png"
                      alt="MoMo"
                      height="20"
                      className="mb-1"
                    />
                    <div className="small fw-bold text-danger">Ví MoMo</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tổng tiền và Nút xác nhận */}
            <div className="pt-4 border-top">
              <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                  <span className="text-muted d-block small">
                    Cần trả ngay:
                  </span>
                  <span className="h2 fw-bold text-success mb-0">
                    {selectedSlot
                      ? `${(payOption === 'full' ? field.price_per_hour : field.price_per_hour * 0.5).toLocaleString()}đ`
                      : '---'}
                  </span>
                </div>
                <div className="text-end text-muted small">Đã bao gồm VAT</div>
              </div>
              <button
                className="btn btn-success btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm transition-all"
                disabled={!selectedSlot}
                onClick={handleBooking}
              >
                XÁC NHẬN ĐẶT SÂN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetail;

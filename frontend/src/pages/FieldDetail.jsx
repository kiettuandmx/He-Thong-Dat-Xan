import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFieldTypeLabel } from '../constants/fieldTypes';
import { formatLocationParts } from '../utils/locationHelpers';
import {
  getBrowseFieldsPathByRole,
  getCurrentUserId,
  getHistoryPathByRole,
} from '../utils/authHelpers';

const TIME_SLOTS = [
  { id: 1, time: '05:00 - 06:00', start: '05:00', end: '06:00' },
  { id: 2, time: '06:00 - 07:00', start: '06:00', end: '07:00' },
  { id: 3, time: '07:00 - 08:00', start: '07:00', end: '08:00' },
  { id: 4, time: '17:00 - 18:00', start: '17:00', end: '18:00' },
  { id: 5, time: '18:00 - 19:00', start: '18:00', end: '19:00' },
  { id: 6, time: '19:00 - 20:00', start: '19:00', end: '20:00' },
  { id: 7, time: '20:00 - 21:00', start: '20:00', end: '21:00' },
  { id: 8, time: '21:00 - 22:00', start: '21:00', end: '22:00' },
];

const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
};

const resolveImageUrl = (image) => {
  if (!image) {
    return 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1600';
  }

  return image.startsWith('http') ? image : `http://localhost:5000/uploads/${image}`;
};

const FieldDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdminFlow = location.pathname.startsWith('/admin/');

  const [field, setField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [payOption, setPayOption] = useState('full');
  const [lockedSlots, setLockedSlots] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const fetchFieldDetail = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:5000/api/fields/${id}`);
      setField(response.data);
    } catch (requestError) {
      console.error('Lỗi khi tải chi tiết sân:', requestError);
      setError(
        requestError.response?.data?.error ||
          'Không thể tải thông tin sân. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldDetail();
  }, [id]);

  useEffect(() => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
  }, [id, selectedDate]);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    const authData = localStorage.getItem('user');
    let currentUserId = null;

    if (authData) {
      try {
        currentUserId = JSON.parse(authData).user?.id;
      } catch {
        currentUserId = null;
      }
    }

    socket.on('slotLocked', (data) => {
      if (data.field_id !== Number(id)) return;

      const slotKey = `${data.date}|${data.start_time}`;
      setLockedSlots((prev) => [...prev, slotKey]);
      setSelectedSlot((previousSlotId) => {
        const lockedSlotInfo = TIME_SLOTS.find(
          (slot) => slot.start === data.start_time.substring(0, 5)
        );

        if (
          lockedSlotInfo &&
          lockedSlotInfo.id === previousSlotId &&
          data.date === selectedDate &&
          data.locked_by_user !== currentUserId
        ) {
          window.alert('Khung giờ này vừa được người khác giữ chỗ. Vui lòng chọn giờ khác.');
          return null;
        }

        return previousSlotId;
      });
    });

    socket.on('slotReleased', (data) => {
      if (data.field_id !== Number(id)) return;

      const slotKey = `${data.date}|${data.start_time}`;
      setLockedSlots((prev) => prev.filter((key) => key !== slotKey));
    });

    socket.on('slotConfirmed', (data) => {
      if (data.field_id === Number(id)) {
        fetchFieldDetail();
      }
    });

    return () => socket.disconnect();
  }, [id, selectedDate]);

  const fieldImage = useMemo(
    () => resolveImageUrl(field?.images?.[0]?.image_url),
    [field?.images]
  );

  const venueLabel =
    formatLocationParts(
      field?.stadium?.location?.address,
      field?.stadium?.location?.district,
      field?.stadium?.location?.city
    ) ||
    'TP. Hồ Chí Minh';

  const activeSlot = TIME_SLOTS.find((slot) => slot.id === selectedSlot);
  const basePrice = Number(field?.price_per_hour || 0);
  const discountedPrice = Math.max(basePrice - couponDiscount, 0);
  const amountToPay = payOption === 'deposit' ? discountedPrice * 0.5 : discountedPrice;

  const isSlotBooked = (slot) => {
    if (!field) return false;

    const today = getTodayString();
    if (selectedDate < today) return true;

    if (selectedDate === today) {
      const now = new Date();
      const [slotHour, slotMinute] = slot.start.split(':').map(Number);
      if (
        slotHour < now.getHours() ||
        (slotHour === now.getHours() && slotMinute <= now.getMinutes())
      ) {
        return true;
      }
    }

    const isLocked = lockedSlots.some((key) => {
      const [lockDate, lockTime] = key.split('|');
      return lockDate === selectedDate && lockTime.substring(0, 5) === slot.start;
    });

    if (isLocked) return true;

    const inSchedules = field.schedules?.some((schedule) => {
      const scheduleDate = schedule.date.split('T')[0];
      const scheduleStart = schedule.start_time.substring(0, 5);
      return (
        scheduleDate === selectedDate &&
        scheduleStart === slot.start &&
        schedule.is_available === false
      );
    });

    if (inSchedules) return true;

    return field.bookings?.some((booking) => {
      if (['cancelled', 'expired', 'refunded'].includes(booking.status)) return false;
      return (
        booking.booking_date === selectedDate &&
        booking.start_time.substring(0, 5) === slot.start
      );
    });
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá.');
      return;
    }

    if (!user) {
      setCouponError('Vui lòng đăng nhập để sử dụng mã giảm giá.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/coupons/validate', {
        code: couponCode,
        user_id: getCurrentUserId(user),
        total_price: basePrice,
      });

      if (response.data.valid) {
        setCouponDiscount(response.data.discount_amount);
        setCouponError('');
        window.alert(
          `Mã giảm giá hợp lệ. Bạn được giảm ${response.data.discount_amount.toLocaleString(
            'vi-VN'
          )}đ.`
        );
      }
    } catch (requestError) {
      setCouponError(
        requestError.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.'
      );
      setCouponDiscount(0);
    }
  };

  const handleBooking = async () => {
    const authData = localStorage.getItem('user');
    let token = null;
    let userId = null;

    if (authData) {
      try {
        const parsedData = JSON.parse(authData);
        token = parsedData.token;
        userId = parsedData.user?.id;
      } catch {
        token = authData;
      }
    }

    if (!token || !userId) {
      window.alert('Vui lòng đăng nhập để đặt sân.');
      return;
    }

    if (!activeSlot) {
      window.alert('Vui lòng chọn khung giờ trước khi đặt sân.');
      return;
    }

    const bookingData = {
      user_id: userId,
      field_id: field.id,
      stadium_id: field.stadium_id,
      booking_date: selectedDate,
      start_time: activeSlot.start,
      end_time: activeSlot.end,
      total_price: discountedPrice,
      amount_paid: amountToPay,
      payment_type: payOption,
      payment_method: paymentMethod,
      status: 'pending',
      coupon_code: couponCode || null,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/bookings/book', bookingData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const bookingId = response.data?.data?.id;

      if (!bookingId) {
        window.alert('Đặt sân thành công.');
        navigate(getHistoryPathByRole(user));
        return;
      }

      const targetPath =
        paymentMethod === 'vnpay'
          ? isAdminFlow
            ? `/admin/payment-vnpay/${bookingId}`
            : `/payment-vnpay/${bookingId}`
          : isAdminFlow
            ? `/admin/payment-momo/${bookingId}`
            : `/payment-momo/${bookingId}`;

      navigate(targetPath, {
        state: {
          amount: amountToPay,
          bookingId,
          description:
            payOption === 'deposit'
              ? `Đặt cọc 50% cho sân ${field.name}`
              : `Thanh toán toàn bộ cho sân ${field.name}`,
        },
      });
    } catch (requestError) {
      console.error('Lỗi khi đặt sân:', requestError);
      window.alert(requestError.response?.data?.message || 'Đặt sân thất bại. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="detail-page">
        <div className="listing-state-card">
          <h2 className="h5 fw-bold">Đang tải thông tin sân...</h2>
          <p className="mb-0 text-muted">Hệ thống đang chuẩn bị lịch trống và thông tin chi tiết.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <div className="listing-state-card">
          <h2 className="h5 fw-bold">Không thể tải thông tin sân</h2>
          <p className="mb-3 text-muted">{error}</p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <button type="button" className="primary-button px-4 py-3" onClick={fetchFieldDetail}>
              Thử lại
            </button>
            <button
              type="button"
              className="secondary-button px-4 py-3"
              onClick={() => navigate(isAdminFlow ? getBrowseFieldsPathByRole(user) : '/')}
            >
              Quay về danh sách sân
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!field) return null;

  return (
    <div className="detail-page">
      <section
        className="detail-hero"
        style={{ '--detail-hero-image': `url(${fieldImage})` }}
      ></section>

      <section className="detail-summary">
        <div>
          <p className="eyebrow">Thông tin sân</p>
          <h1>{field.name}</h1>
          <p className="mb-2 text-muted">
            <i className="bi bi-geo-alt me-2 text-danger"></i>
            {venueLabel}
          </p>
          <div className="d-flex flex-wrap gap-2">
            <span className="field-card__badge badge-default">{getFieldTypeLabel(field.type)}</span>
            <span className="field-card__badge badge-football">
              {field.reviews?.length || 0} đánh giá
            </span>
            <span className="field-card__badge badge-badminton">Còn nhận đặt</span>
          </div>
        </div>
        <div className="detail-price-box">
          <div className="small mb-1">Giá tham khảo</div>
          <strong>{basePrice.toLocaleString('vi-VN')}đ</strong>
          <div className="small mt-1">mỗi giờ</div>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <div className="mb-4">
            <h2 className="h4 fw-bold mb-3">Lịch đặt sân</h2>
            <div className="detail-meta-list">
              <div>
                <strong>Cơ sở:</strong> {field.stadium?.name || 'Đang cập nhật'}
              </div>
              <div>
                <strong>Địa chỉ:</strong> {venueLabel}
              </div>
              <div>
                <strong>Loại sân:</strong> {getFieldTypeLabel(field.type)}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="filter-label" htmlFor="selectedDate">
              Ngày đặt sân
            </label>
            <input
              id="selectedDate"
              className="filter-input"
              min={getTodayString()}
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          <div className="mb-4">
            <h3 className="h5 fw-bold mb-3">Chọn khung giờ</h3>
            <div className="detail-slot-grid">
              {TIME_SLOTS.map((slot) => {
                const disabled = isSlotBooked(slot);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={`detail-slot-button ${selectedSlot === slot.id ? 'is-selected' : ''}`}
                    disabled={disabled}
                    onClick={() => setSelectedSlot(slot.id)}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="h5 fw-bold mb-3">Đánh giá từ người chơi</h3>
            {field.reviews?.length ? (
              <div className="d-grid gap-3">
                {field.reviews.map((review) => (
                  <div key={review.id} className="account-card">
                    <div className="d-flex justify-content-between gap-3 flex-wrap mb-2">
                      <strong>{review.user?.name || `Khách hàng #${review.user_id}`}</strong>
                      <span className="text-warning">{'★'.repeat(review.rating)}</span>
                    </div>
                    <p className="mb-2">{review.comment}</p>
                    {review.owner_reply && (
                      <div className="account-empty-state text-start">
                        <strong>Phản hồi từ chủ sân:</strong> {review.owner_reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="account-empty-state">
                Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên chia sẻ trải nghiệm.
              </div>
            )}
          </div>
        </article>

        <aside className="detail-panel detail-panel--sticky">
          <h2 className="h4 fw-bold mb-3">Đặt sân ngay</h2>

          <div className="d-grid gap-3 mb-4">
            <button
              type="button"
              className={`payment-option ${payOption === 'full' ? 'is-active' : ''}`}
              onClick={() => setPayOption('full')}
            >
              <strong>Thanh toán toàn bộ</strong>
              <div className="text-muted mt-1">
                {discountedPrice.toLocaleString('vi-VN')}đ cho một khung giờ.
              </div>
            </button>
            <button
              type="button"
              className={`payment-option ${payOption === 'deposit' ? 'is-active' : ''}`}
              onClick={() => setPayOption('deposit')}
            >
              <strong>Đặt cọc 50%</strong>
              <div className="text-muted mt-1">
                {(discountedPrice * 0.5).toLocaleString('vi-VN')}đ để giữ sân trước.
              </div>
            </button>
          </div>

          <div className="mb-4">
            <label className="filter-label" htmlFor="couponCode">
              Mã giảm giá
            </label>
            <div className="d-flex gap-2 mt-2">
              <input
                id="couponCode"
                className="filter-input"
                placeholder="Nhập mã giảm giá"
                type="text"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              />
              <button type="button" className="secondary-button px-3" onClick={validateCoupon}>
                Áp dụng
              </button>
            </div>
            {couponError && <div className="text-danger small mt-2">{couponError}</div>}
            {couponDiscount > 0 && (
              <div className="text-success small mt-2">
                Giảm {couponDiscount.toLocaleString('vi-VN')}đ cho lượt đặt này.
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="filter-label mb-2">Cổng thanh toán</p>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`payment-option flex-fill ${paymentMethod === 'vnpay' ? 'is-active' : ''}`}
                onClick={() => setPaymentMethod('vnpay')}
              >
                VNPay
              </button>
              <button
                type="button"
                className={`payment-option flex-fill ${paymentMethod === 'momo' ? 'is-active' : ''}`}
                onClick={() => setPaymentMethod('momo')}
              >
                MoMo
              </button>
            </div>
          </div>

          <div className="account-card">
            <div className="d-flex justify-content-between gap-3 mb-2">
              <span className="text-muted">Khung giờ đã chọn</span>
              <strong>{activeSlot ? activeSlot.time : 'Chưa chọn'}</strong>
            </div>
            <div className="d-flex justify-content-between gap-3 mb-3">
              <span className="text-muted">Cần thanh toán ngay</span>
              <strong>{activeSlot ? `${amountToPay.toLocaleString('vi-VN')}đ` : '---'}</strong>
            </div>
            <button
              type="button"
              className="primary-button w-100 py-3"
              disabled={!selectedSlot}
              onClick={handleBooking}
            >
              Xác nhận đặt sân
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default FieldDetail;

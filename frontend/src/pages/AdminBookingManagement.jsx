import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const getAuthHeader = () => {
  const authData = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    Authorization: `Bearer ${authData?.token || ''}`,
  };
};

const statusBadgeMap = {
  pending: 'text-bg-warning',
  confirmed: 'text-bg-success',
  rejected: 'text-bg-danger',
  refunded: 'text-bg-info',
  cancelled: 'text-bg-secondary',
};

const bookingStatusLabelMap = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã duyệt',
  rejected: 'Đã từ chối',
  refunded: 'Đã hoàn tiền',
  cancelled: 'Đã hủy',
  completed: 'Hoàn tất',
};

const paymentStatusLabelMap = {
  paid: 'Đã thanh toán',
  partially_paid: 'Thanh toán một phần',
  unpaid: 'Chưa thanh toán',
  refunded: 'Đã hoàn tiền',
  failed: 'Thất bại',
};

const paymentTypeLabelMap = {
  wallet: 'Ví',
  momo: 'MoMo',
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
};

const AdminBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadBookings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/bookings', {
        headers: getAuthHeader(),
      });
      setBookings(res.data || []);
    } catch (error) {
      console.error('Lỗi tải danh sách đơn admin:', error);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const summary = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === 'pending').length,
      confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
      refunded: bookings.filter((booking) => booking.status === 'refunded').length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    return bookings.filter((booking) => booking.status === statusFilter);
  }, [bookings, statusFilter]);

  const performAction = async (bookingId, action) => {
    try {
      const headers = getAuthHeader();

      if (action === 'approve') {
        await axios.put(`http://localhost:5000/api/bookings/approve/${bookingId}`, {}, { headers });
      }

      if (action === 'reject') {
        const reject_reason = window.prompt('Nhập lý do từ chối đơn:');
        if (!reject_reason) return;
        await axios.patch(
          `http://localhost:5000/api/bookings/reject/${bookingId}`,
          { reject_reason },
          { headers }
        );
      }

      if (action === 'refund') {
        const refund_reason = window.prompt('Nhập lý do hoàn tiền đơn:');
        if (!refund_reason) return;
        await axios.put(
          `http://localhost:5000/api/bookings/refund/${bookingId}`,
          { refund_reason },
          { headers }
        );
      }

      loadBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật đơn đặt sân.');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Tổng đơn</small>
            <div className="fs-2 fw-bold">{summary.total}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Chờ xử lý</small>
            <div className="fs-2 fw-bold text-warning">{summary.pending}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Đã duyệt</small>
            <div className="fs-2 fw-bold text-success">{summary.confirmed}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Đã hoàn tiền</small>
            <div className="fs-2 fw-bold text-info">{summary.refunded}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-4 shadow-sm p-4">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">Quản lý đơn đặt sân toàn hệ thống</h3>
            <p className="text-muted mb-0">Admin có thể duyệt, từ chối và hoàn tiền ngay trên dashboard.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'rejected', 'refunded'].map((status) => (
              <button
                key={status}
                className={`btn btn-sm rounded-pill ${statusFilter === status ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'Tất cả' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Chủ sân</th>
                <th>Sân</th>
                <th>Lịch chơi</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="fw-semibold">{booking.user?.name || 'N/A'}</div>
                    <div className="small text-muted">{booking.user?.phone || booking.user?.email || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="fw-semibold">{booking.stadium?.owner?.name || booking.field?.stadium?.owner?.name || 'N/A'}</div>
                    <div className="small text-muted">{booking.stadium?.name || booking.field?.stadium?.name || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="fw-semibold">{booking.field?.name || 'N/A'}</div>
                    <div className="small text-muted">{booking.field?.type || 'N/A'}</div>
                  </td>
                  <td>
                    <div>{new Date(booking.booking_date).toLocaleDateString('vi-VN')}</div>
                    <div className="small text-muted">
                      {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                    </div>
                  </td>
                  <td>
                    <div className="fw-semibold">{Number(booking.amount_paid || 0).toLocaleString()}đ</div>
                    <div className="small text-muted">
                      {paymentTypeLabelMap[booking.payment_type] || booking.payment_type || 'N/A'} / {paymentStatusLabelMap[booking.payment_status] || booking.payment_status || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeMap[booking.status] || 'text-bg-secondary'}`}>
                      {bookingStatusLabelMap[booking.status] || booking.status || 'unknown'}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm rounded-pill" onClick={() => performAction(booking.id, 'approve')}>
                            Duyệt
                          </button>
                          <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => performAction(booking.id, 'reject')}>
                            Từ chối
                          </button>
                        </>
                      )}
                      {['pending', 'confirmed'].includes(booking.status) && (
                        <button className="btn btn-outline-warning btn-sm rounded-pill" onClick={() => performAction(booking.id, 'refund')}>
                          Hoàn tiền
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5">
                    Không có đơn đặt sân phù hợp bộ lọc.
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

export default AdminBookingManagement;

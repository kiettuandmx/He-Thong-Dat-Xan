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
      console.error('Loi tai danh sach don admin:', error);
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
        const reject_reason = window.prompt('Nhap ly do tu choi don:');
        if (!reject_reason) return;
        await axios.patch(
          `http://localhost:5000/api/bookings/reject/${bookingId}`,
          { reject_reason },
          { headers }
        );
      }

      if (action === 'refund') {
        const refund_reason = window.prompt('Nhap ly do hoan tien don:');
        if (!refund_reason) return;
        await axios.put(
          `http://localhost:5000/api/bookings/refund/${bookingId}`,
          { refund_reason },
          { headers }
        );
      }

      loadBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Khong the cap nhat don dat san.');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Tong don</small>
            <div className="fs-2 fw-bold">{summary.total}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Cho xu ly</small>
            <div className="fs-2 fw-bold text-warning">{summary.pending}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Da duyet</small>
            <div className="fs-2 fw-bold text-success">{summary.confirmed}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded-4 shadow-sm p-3">
            <small className="text-muted d-block mb-1">Da hoan tien</small>
            <div className="fs-2 fw-bold text-info">{summary.refunded}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-4 shadow-sm p-4">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">Quan ly don dat san toan he thong</h3>
            <p className="text-muted mb-0">Admin co the duyet, tu choi va hoan tien ngay tren dashboard.</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'rejected', 'refunded'].map((status) => (
              <button
                key={status}
                className={`btn btn-sm rounded-pill ${statusFilter === status ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'Tat ca' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Khach hang</th>
                <th>Chu san</th>
                <th>San</th>
                <th>Lich choi</th>
                <th>Thanh toan</th>
                <th>Trang thai</th>
                <th className="text-end">Thao tac</th>
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
                    <div className="fw-semibold">{Number(booking.amount_paid || 0).toLocaleString()}d</div>
                    <div className="small text-muted">
                      {booking.payment_type || 'N/A'} / {booking.payment_status || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeMap[booking.status] || 'text-bg-secondary'}`}>
                      {booking.status || 'unknown'}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm rounded-pill" onClick={() => performAction(booking.id, 'approve')}>
                            Duyet
                          </button>
                          <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => performAction(booking.id, 'reject')}>
                            Tu choi
                          </button>
                        </>
                      )}
                      {['pending', 'confirmed'].includes(booking.status) && (
                        <button className="btn btn-outline-warning btn-sm rounded-pill" onClick={() => performAction(booking.id, 'refund')}>
                          Hoan tien
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5">
                    Khong co don dat san phu hop bo loc.
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

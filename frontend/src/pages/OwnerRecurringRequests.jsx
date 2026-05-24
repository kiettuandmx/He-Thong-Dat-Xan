import React, { useEffect, useState } from 'react';
import {
  approveRecurringBooking,
  getOwnerRecurringBookings,
  rejectRecurringBooking,
} from '../services/recurringBookingService';

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');

const OwnerRecurringRequests = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRows = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getOwnerRecurringBookings();
      setRows(response.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const handleApprove = async (id) => {
    await approveRecurringBooking(id);
    await loadRows();
  };

  const handleReject = async (id) => {
    await rejectRecurringBooking(id);
    await loadRows();
  };

  return (
    <div className="detail-page recurring-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow mb-2">Chủ sân duyệt</p>
          <h1 className="display-title mb-3">Yêu cầu đặt sân định kỳ</h1>
          <p className="detail-subtitle mb-0">
            Xem các chuỗi đặt định kỳ đang chờ duyệt và ra quyết định nhanh cho từng khách hàng.
          </p>
        </div>
      </section>

      <section className="detail-panel">
        {loading && <div className="account-empty-state text-start">Đang tải yêu cầu...</div>}
        {error && <div className="alert alert-danger rounded-4 mb-0">{error}</div>}

        {!loading && !error && rows.length === 0 && (
          <div className="account-empty-state text-start">Không có yêu cầu nào đang chờ duyệt.</div>
        )}

        {!loading && rows.length > 0 && (
          <div className="row g-3">
            {rows.map((row) => (
              <div key={row.id} className="col-12">
                <div className="recurring-owner-card">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div>
                      <h2 className="h5 fw-bold mb-2">{row.user?.name || 'Khách hàng'}</h2>
                      <p className="text-muted mb-2">
                        {row.field?.name || 'Sân'} - Cọc {formatCurrency(row.deposit_amount)}đ / Tổng{' '}
                        {formatCurrency(row.total_estimated_amount)}đ
                      </p>
                      <div className="small text-muted">
                        {row.items?.length || 0} buổi - Buổi đầu {row.items?.[0]?.scheduled_date || 'đang cập nhật'}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-start">
                      <button type="button" className="primary-button" onClick={() => handleApprove(row.id)}>
                        Duyệt
                      </button>
                      <button type="button" className="secondary-button" onClick={() => handleReject(row.id)}>
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OwnerRecurringRequests;

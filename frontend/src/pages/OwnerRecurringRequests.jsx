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
      setError(requestError.response?.data?.message || 'Khong the tai danh sach yeu cau.');
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
          <p className="eyebrow mb-2">Owner review</p>
          <h1 className="display-title mb-3">Yeu cau dat san dinh ky</h1>
          <p className="detail-subtitle mb-0">
            Xem cac chuoi dat dinh ky dang cho duyet va ra quyet dinh nhanh cho tung khach hang.
          </p>
        </div>
      </section>

      <section className="detail-panel">
        {loading && <div className="account-empty-state text-start">Dang tai yeu cau...</div>}
        {error && <div className="alert alert-danger rounded-4 mb-0">{error}</div>}

        {!loading && !error && rows.length === 0 && (
          <div className="account-empty-state text-start">Khong co yeu cau nao dang cho duyet.</div>
        )}

        {!loading && rows.length > 0 && (
          <div className="row g-3">
            {rows.map((row) => (
              <div key={row.id} className="col-12">
                <div className="recurring-owner-card">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                    <div>
                      <h2 className="h5 fw-bold mb-2">{row.user?.name || 'Khach hang'}</h2>
                      <p className="text-muted mb-2">
                        {row.field?.name || 'San'} - Coc {formatCurrency(row.deposit_amount)}d / Tong{' '}
                        {formatCurrency(row.total_estimated_amount)}d
                      </p>
                      <div className="small text-muted">
                        {row.items?.length || 0} buoi - Buoi dau {row.items?.[0]?.scheduled_date || 'dang cap nhat'}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-start">
                      <button type="button" className="primary-button" onClick={() => handleApprove(row.id)}>
                        Duyet
                      </button>
                      <button type="button" className="secondary-button" onClick={() => handleReject(row.id)}>
                        Tu choi
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

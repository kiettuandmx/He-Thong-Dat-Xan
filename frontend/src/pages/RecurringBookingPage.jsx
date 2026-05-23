import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  createRecurringBooking,
  getMyRecurringBookings,
  previewRecurringBooking,
} from '../services/recurringBookingService';

const getTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');

const defaultFieldState = {
  id: null,
  name: 'Sân chưa được chọn',
  price_per_hour: 0,
};

const RecurringBookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const field = location.state?.field || defaultFieldState;

  const [form, setForm] = useState({
    recurrence_type: 'weekly',
    start_date: getTodayString(),
    end_date: '',
    occurrence_count: 4,
    start_time: '18:00',
    end_time: '19:00',
    deposit_amount: '',
    payment_method: 'wallet',
  });
  const [preview, setPreview] = useState(null);
  const [seriesRows, setSeriesRows] = useState([]);
  const [replacementSelections, setReplacementSelections] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestPayload = useMemo(
    () => ({
      field_id: field.id,
      recurrence_type: form.recurrence_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      occurrence_count: form.end_date ? null : Number(form.occurrence_count || 0),
      start_time: form.start_time,
      end_time: form.end_time,
      deposit_amount: Number(form.deposit_amount || 0),
      payment_method: form.payment_method,
      replacement_selections: replacementSelections,
    }),
    [field.id, form, replacementSelections]
  );

  useEffect(() => {
    let ignore = false;

    const loadSeries = async () => {
      try {
        const response = await getMyRecurringBookings();
        if (!ignore) {
          setSeriesRows(response.data?.data || []);
        }
      } catch {
        if (!ignore) {
          setSeriesRows([]);
        }
      }
    };

    loadSeries();

    return () => {
      ignore = true;
    };
  }, []);

  const handlePreview = async () => {
    if (!field.id) {
      setError('Hãy chọn sân trước khi tạo chuỗi đặt sân định kỳ.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await previewRecurringBooking(requestPayload);
      setPreview(response.data?.data || null);
      setMessage('Đã tạo bản xem trước cho chuỗi đặt sân.');
    } catch (requestError) {
      setPreview(requestError.response?.data?.data || null);
      setError(requestError.response?.data?.message || 'Không thể xem trước chuỗi đặt sân.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await createRecurringBooking(requestPayload);
      setMessage(
        response.data?.data?.approval_status === 'approved'
          ? 'Chuỗi đặt sân định kỳ đã được tạo và duyệt tự động.'
          : 'Yêu cầu đặt sân định kỳ đã được gửi cho chủ sân duyệt.'
      );
      const latest = await getMyRecurringBookings();
      setSeriesRows(latest.data?.data || []);
      setPreview(null);
      setReplacementSelections([]);
    } catch (requestError) {
      setPreview(requestError.response?.data?.data || null);
      setError(requestError.response?.data?.message || 'Không thể tạo chuỗi đặt sân.');
    } finally {
      setLoading(false);
    }
  };

  const pickSuggestion = (originalScheduledDate, suggestion) => {
    setReplacementSelections((current) => {
      const next = current.filter((item) => item.originalScheduledDate !== originalScheduledDate);
      next.push({
        originalScheduledDate,
        scheduledDate: suggestion.scheduledDate,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime,
      });
      return next;
    });
  };

  return (
    <div className="detail-page recurring-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow mb-2">Recurring booking</p>
          <h1 className="display-title mb-3">Đặt sân định kỳ</h1>
          <p className="detail-subtitle mb-0">
            Tạo chuỗi đặt sân theo tuần hoặc theo tháng, đặt cọc một lần cho cả chuỗi và để owner
            duyệt khi mức cọc dưới 50%.
          </p>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h2 className="h4 fw-bold mb-1">{field.name}</h2>
              <p className="text-muted mb-0">
                Giá cơ bản: {formatCurrency(field.price_per_hour)}đ / khung giờ
              </p>
            </div>
            <button type="button" className="secondary-button" onClick={() => navigate(-1)}>
              Quay lại
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="filter-label" htmlFor="recurrenceType">
                Hình thức lặp
              </label>
              <select
                id="recurrenceType"
                className="filter-input"
                value={form.recurrence_type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, recurrence_type: event.target.value }))
                }
              >
                <option value="weekly">Theo tuần</option>
                <option value="monthly">Theo tháng</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="filter-label" htmlFor="depositAmount">
                Tiền cọc
              </label>
              <input
                id="depositAmount"
                className="filter-input"
                type="number"
                min="0"
                value={form.deposit_amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deposit_amount: event.target.value }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="filter-label" htmlFor="startDate">
                Ngày bắt đầu
              </label>
              <input
                id="startDate"
                className="filter-input"
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, start_date: event.target.value }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="filter-label" htmlFor="endDate">
                Ngày kết thúc
              </label>
              <input
                id="endDate"
                className="filter-input"
                type="date"
                value={form.end_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, end_date: event.target.value }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="filter-label" htmlFor="occurrenceCount">
                Số buổi
              </label>
              <input
                id="occurrenceCount"
                className="filter-input"
                type="number"
                min="1"
                value={form.occurrence_count}
                disabled={Boolean(form.end_date)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, occurrence_count: event.target.value }))
                }
              />
            </div>

            <div className="col-md-3">
              <label className="filter-label" htmlFor="startTime">
                Giờ bắt đầu
              </label>
              <input
                id="startTime"
                className="filter-input"
                type="time"
                value={form.start_time}
                onChange={(event) =>
                  setForm((current) => ({ ...current, start_time: event.target.value }))
                }
              />
            </div>

            <div className="col-md-3">
              <label className="filter-label" htmlFor="endTime">
                Giờ kết thúc
              </label>
              <input
                id="endTime"
                className="filter-input"
                type="time"
                value={form.end_time}
                onChange={(event) =>
                  setForm((current) => ({ ...current, end_time: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-4">
            <button type="button" className="primary-button" disabled={loading} onClick={handlePreview}>
              Xem trước chuỗi đặt
            </button>
            {preview && (
              <button type="button" className="secondary-button" disabled={loading} onClick={handleCreate}>
                Gửi yêu cầu đặt định kỳ
              </button>
            )}
          </div>

          {message && <div className="alert alert-success rounded-4 mt-4 mb-0">{message}</div>}
          {error && <div className="alert alert-danger rounded-4 mt-4 mb-0">{error}</div>}
        </article>

        <aside className="detail-panel detail-panel--sticky">
          <h2 className="h5 fw-bold mb-3">Tóm tắt chuỗi đặt</h2>
          {preview ? (
            <div className="recurring-summary-card">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Số buổi</span>
                <strong>{preview.occurrenceCount}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tổng giá trị</span>
                <strong>{formatCurrency(preview.totalEstimatedAmount)}d</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tiền cọc</span>
                <strong>{formatCurrency(preview.depositAmount)}d</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Kết quả</span>
                <strong>{preview.approvalStatus === 'approved' ? 'Tự động duyệt' : 'Chờ owner duyệt'}</strong>
              </div>
            </div>
          ) : (
            <div className="account-empty-state text-start">
              Bạn xem trước để kiểm tra tổng tiền, số buổi và các khung giờ bị trùng.
            </div>
          )}
        </aside>
      </section>

      {preview?.hasConflicts && (
        <section className="detail-panel mt-4">
          <h2 className="h5 fw-bold mb-3">Khung giờ đề xuất thay thế</h2>
          <div className="row g-3">
            {preview.conflicts.map((conflict) => (
              <div key={conflict.requestedSlot.scheduledDate} className="col-12">
                <div className="recurring-conflict-card">
                  <h3 className="h6 fw-bold mb-2">
                    {conflict.requestedSlot.scheduledDate} - {String(conflict.requestedSlot.startTime).slice(0, 5)}
                  </h3>
                  <div className="d-flex flex-wrap gap-2">
                    {conflict.suggestions.map((suggestion) => (
                      <button
                        key={`${conflict.requestedSlot.scheduledDate}-${suggestion.scheduledDate}-${suggestion.startTime}`}
                        type="button"
                        className="secondary-button"
                        onClick={() => pickSuggestion(conflict.requestedSlot.scheduledDate, suggestion)}
                      >
                        {suggestion.scheduledDate} - {String(suggestion.startTime).slice(0, 5)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="detail-panel mt-4">
        <h2 className="h5 fw-bold mb-3">Chuỗi đặt của tôi</h2>
        {seriesRows.length > 0 ? (
          <div className="row g-3">
            {seriesRows.map((series) => (
              <div key={series.id} className="col-lg-6">
                <div className="recurring-series-card">
                  <div className="d-flex justify-content-between gap-3 mb-2">
                    <strong>{series.field?.name || 'Chuỗi đặt sân'}</strong>
                    <span className="badge text-bg-light">{series.approval_status}</span>
                  </div>
                  <div className="small text-muted">
                    Cọc {formatCurrency(series.deposit_amount)}đ / Tổng {formatCurrency(series.total_estimated_amount)}đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="account-empty-state text-start">Bạn chưa có chuỗi đặt sân định kỳ nào.</div>
        )}
      </section>
    </div>
  );
};

export default RecurringBookingPage;

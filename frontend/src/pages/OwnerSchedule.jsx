import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const timeSlots = [
  { id: 1, label: '05:00 - 06:00', start: '05:00' },
  { id: 2, label: '06:00 - 07:00', start: '06:00' },
  { id: 3, label: '07:00 - 08:00', start: '07:00' },
  { id: 4, label: '17:00 - 18:00', start: '17:00' },
  { id: 5, label: '18:00 - 19:00', start: '18:00' },
  { id: 6, label: '19:00 - 20:00', start: '19:00' },
  { id: 7, label: '20:00 - 21:00', start: '20:00' },
  { id: 8, label: '21:00 - 22:00', start: '21:00' },
];

const OwnerSchedule = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('all');
  const [selectedView, setSelectedView] = useState('day');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const ownerId = user?.user?.id;

  const buildDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const isPast = (dateString) => {
    const target = buildDate(dateString);
    return target < buildDate(todayStr);
  };

  const getWeekDates = (dateString) => {
    const date = buildDate(dateString);
    const weekday = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (weekday === 0 ? 6 : weekday - 1));

    return Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + idx);
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    });
  };

  const getMonthDays = (dateString) => {
    const date = buildDate(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: days }, (_, idx) => {
      const day = new Date(year, month, idx + 1);
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const authData = JSON.parse(localStorage.getItem('user'));
      const token = authData?.token;
      if (!token || !ownerId) {
        setError('Không tìm thấy thông tin đăng nhập');
        setLoading(false);
        return;
      }

      const [fieldRes, bookingRes] = await Promise.all([
        axios.get('http://localhost:5000/api/owner/fields', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:5000/api/bookings/owner/${ownerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setFields(Array.isArray(fieldRes.data) ? fieldRes.data : []);
      setBookings(Array.isArray(bookingRes.data) ? bookingRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải lịch trạng thái sân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredFields = selectedFieldId === 'all'
    ? fields
    : fields.filter((field) => field.id === Number(selectedFieldId));

  const fieldBookings = (fieldId, dateString) => {
    return bookings.filter((booking) =>
      booking.field_id === fieldId &&
      booking.booking_date === dateString &&
      !['cancelled', 'expired', 'refunded'].includes(booking.status)
    );
  };

  const getSlotStatus = (field, slot, dateString) => {
    if (isPast(dateString)) return 'past';

    const slotBookings = fieldBookings(field.id, dateString).filter(
      (booking) => booking.start_time.substring(0, 5) === slot.start
    );

    if (slotBookings.length === 0) return 'available';

    const confirmed = slotBookings.some((booking) => booking.status === 'confirmed');
    const pending = slotBookings.some((booking) => booking.status === 'pending');
    return confirmed ? 'confirmed' : pending ? 'pending' : 'unavailable';
  };

  const activeFields = filteredFields.length > 0 ? filteredFields : fields;

  const selectedSlot = timeSlots.find((slot) => slot.id === selectedSlotId);
  const availableFieldsForSelectedSlot = selectedSlot
    ? activeFields.filter((field) => getSlotStatus(field, selectedSlot, selectedDate) === 'available')
    : [];

  const summaryForDate = (dateString) => {
    const totalBooked = activeFields.reduce((acc, field) => {
      return acc + fieldBookings(field.id, dateString).length;
    }, 0);
    const totalSlots = activeFields.length * timeSlots.length;
    return { totalBooked, totalSlots };
  };

  const weeklySummary = getWeekDates(selectedDate).map((day) => {
    const { totalBooked, totalSlots } = summaryForDate(day);
    return { day, totalBooked, totalSlots };
  });

  const monthlySummary = getMonthDays(selectedDate).map((day) => {
    const { totalBooked } = summaryForDate(day);
    return { day, totalBooked };
  });

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-3">Đang tải dữ liệu lịch trạng thái sân...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger rounded-4 shadow-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-2">Xem trạng thái sân</h2>
          <p className="text-muted mb-0">
            Nắm bắt trạng thái sân, giờ trống và lịch đặt theo ngày, tuần hoặc tháng.
          </p>
        </div>
        <div className="btn-group" role="group">
          {['day', 'week', 'month'].map((view) => (
            <button
              key={view}
              type="button"
              className={`btn ${selectedView === view ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => {
                setSelectedView(view);
                setSelectedSlotId(null);
              }}
            >
              {view === 'day' ? 'Ngày' : view === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-3">Bộ lọc</h5>
            <label className="form-label small fw-semibold">Chọn sân</label>
            <select
              className="form-select mb-3"
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
            >
              <option value="all">Tất cả sân</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>{field.name} - {field.stadium?.name}</option>
              ))}
            </select>

            <label className="form-label small fw-semibold">Chọn ngày</label>
            <input
              type="date"
              className="form-control mb-3"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlotId(null);
              }}
            />

            <div className="mb-3">
              <div className="small text-muted">Tổng sân hiện có</div>
              <div className="fw-bold fs-5">{fields.length}</div>
            </div>
            <div>
              <div className="small text-muted">Lịch đặt ngày</div>
              <div className="fw-bold fs-5">{summaryForDate(selectedDate).totalBooked} / {activeFields.length * timeSlots.length}</div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1">{selectedView === 'day' ? `Lịch ngày ${selectedDate}` : selectedView === 'week' ? 'Lịch tuần' : 'Lịch tháng'}</h5>
                <p className="text-muted mb-0">Chọn sân hoặc giờ để xem chi tiết trạng thái.</p>
              </div>
              {selectedView === 'day' && selectedSlot && (
                <div className="badge bg-success py-2 px-3">Giờ chọn: {selectedSlot.label}</div>
              )}
            </div>

            {selectedView === 'day' && (
              <>
                <div className="mb-4">
                  <div className="row row-cols-2 row-cols-md-4 g-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        className={`btn ${selectedSlotId === slot.id ? 'btn-success' : 'btn-outline-secondary'} rounded-4 text-start py-3`}
                        onClick={() => setSelectedSlotId(slot.id)}
                      >
                        <div className="fw-semibold">{slot.label}</div>
                        <div className="small text-muted">{selectedSlotId === slot.id ? 'Đang xem' : 'Chọn giờ'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row g-3">
                  {filteredFields.length > 0 ? filteredFields.map((field) => {
                    const fieldSummary = timeSlots.reduce((summary, slot) => {
                      const status = getSlotStatus(field, slot, selectedDate);
                      summary[status] = (summary[status] || 0) + 1;
                      return summary;
                    }, {});

                    return (
                      <div key={field.id} className="col-md-6">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="fw-bold mb-1">{field.name}</h6>
                              <div className="small text-muted">{field.type} • {field.stadium?.name}</div>
                            </div>
                            <span className="badge bg-primary">{fieldSummary.available || 0} trống</span>
                          </div>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            <span className="badge bg-success">Trống {fieldSummary.available || 0}</span>
                            <span className="badge bg-warning text-dark">Chờ {fieldSummary.pending || 0}</span>
                            <span className="badge bg-danger">Đã đặt {fieldSummary.confirmed || 0}</span>
                            <span className="badge bg-secondary">Quá hạn {fieldSummary.past || 0}</span>
                          </div>
                          <div className="small text-muted">Chọn giờ để xem sân trống chính xác.</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="col-12 alert alert-secondary">Không tìm thấy sân phù hợp.</div>
                  )}
                </div>

                {selectedSlot && (
                  <div className="mt-4">
                    <h6 className="fw-semibold mb-3">Sân trống cho giờ {selectedSlot.label}</h6>
                    {availableFieldsForSelectedSlot.length > 0 ? (
                      <div className="row g-3">
                        {availableFieldsForSelectedSlot.map((field) => (
                          <div key={field.id} className="col-md-6">
                            <div className="border rounded-4 p-3 h-100">
                              <div className="fw-bold mb-1">{field.name}</div>
                              <div className="small text-muted mb-2">{field.type} • {field.stadium?.name}</div>
                              <span className="badge bg-success">Trống</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-warning">Không có sân trống cho giờ này.</div>
                    )}
                  </div>
                )}
              </>
            )}

            {selectedView === 'week' && (
              <div className="row g-3">
                {weeklySummary.map((day) => (
                  <div key={day.day} className="col-sm-6 col-xl-4">
                    <div className="border rounded-4 p-3 h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <p className="mb-1 fw-semibold">{new Date(day.day).toLocaleDateString('vi-VN', { weekday: 'short' })}</p>
                          <h6 className="mb-0">{day.day}</h6>
                        </div>
                        <span className="badge bg-secondary">{Math.round((day.totalBooked / Math.max(day.totalSlots, 1)) * 100)}%</span>
                      </div>
                      <p className="mb-1">Đã đặt: <strong>{day.totalBooked}</strong></p>
                      <p className="mb-0">Tổng khung: <strong>{day.totalSlots}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedView === 'month' && (
              <div className="row g-3">
                {monthlySummary.map((day) => (
                  <div key={day.day} className="col-6 col-sm-4 col-md-3">
                    <div className="border rounded-4 p-3 text-center h-100" style={{ minHeight: '120px' }}>
                      <div className="fw-semibold mb-2">{new Date(day.day).getDate()}</div>
                      <div className="small text-muted mb-3">{new Date(day.day).toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                      <div className="badge bg-success py-2 px-3">{day.totalBooked} đặt</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSchedule;

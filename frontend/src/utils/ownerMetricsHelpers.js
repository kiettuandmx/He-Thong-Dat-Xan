export const formatOwnerCurrency = (value) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export const normalizeOwnerSummary = (raw = {}) => ({
  topField: raw.topField || 'Chưa có dữ liệu',
  peakHour: raw.peakHour || 'Chưa có dữ liệu',
  monthlyRevenue: Number(raw.monthlyRevenue || 0),
  todayBookings: Number(raw.todayBookings || 0),
});

export const normalizeOwnerBookings = (bookings = []) =>
  Array.isArray(bookings) ? bookings : [];

export const normalizeOwnerSeries = (series = []) =>
  Array.isArray(series) ? series : [];

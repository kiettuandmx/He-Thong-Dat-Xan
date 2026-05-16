import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatOwnerCurrency,
  normalizeOwnerBookings,
  normalizeOwnerSeries,
  normalizeOwnerSummary,
} from '../utils/ownerMetricsHelpers';

const CHART_COLORS = ['#f04e23', '#ff8a4c', '#1f9d55', '#3156c9', '#ffb020'];

const formatTimeRange = (startTime, endTime) => {
  if (!startTime && !endTime) return 'Chưa có khung giờ';
  if (!endTime) return startTime;
  return `${startTime} - ${endTime}`;
};

const statusMap = {
  confirmed: { label: 'Đã duyệt', className: 'is-success' },
  pending: { label: 'Chờ duyệt', className: 'is-warning' },
  rejected: { label: 'Từ chối', className: 'is-danger' },
  refunded: { label: 'Đã hoàn tiền', className: 'is-danger' },
};

const OwnerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    todayBookings: 0,
    monthlyRevenue: 0,
    fieldUsage: [],
    peakTimes: [],
    summary: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem('user') || 'null');
        const ownerId = authData?.user?.id;
        const token = authData?.token;

        if (!ownerId || !token) {
          setError('Không tìm thấy thông tin chủ sân. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [resBookings, resStats] = await Promise.all([
          axios.get(`http://localhost:5000/api/bookings/owner/${ownerId}`, { headers }),
          axios.get(`http://localhost:5000/api/bookings/analytics/${ownerId}`, { headers }),
        ]);

        setBookings(normalizeOwnerBookings(resBookings.data));
        setStats({
          todayBookings: Number(resStats.data?.todayBookings || 0),
          monthlyRevenue: Number(resStats.data?.monthlyRevenue || 0),
          fieldUsage: normalizeOwnerSeries(resStats.data?.fieldUsage),
          peakTimes: normalizeOwnerSeries(resStats.data?.peakTimes),
          summary: normalizeOwnerSummary({
            ...resStats.data?.summary,
            monthlyRevenue: resStats.data?.monthlyRevenue,
            todayBookings: resStats.data?.todayBookings,
          }),
        });
      } catch (requestError) {
        console.error('Lỗi tải bảng điều khiển chủ sân:', requestError);
        setError('Không thể tải bảng điều khiển chủ sân. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const bookingSummary = useMemo(() => {
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;
    const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length;
    const refundedBookings = bookings.filter((booking) => booking.status === 'refunded').length;

    return {
      pendingBookings,
      confirmedBookings,
      refundedBookings,
      totalBookings: bookings.length,
    };
  }, [bookings]);

  const chartFieldUsage = stats.fieldUsage.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const chartPeakTimes = stats.peakTimes.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const recentBookings = bookings.slice(0, 6);

  if (loading) {
    return (
      <div className="account-page owner-workspace-grid">
        <section className="owner-hero-panel">
          <p className="eyebrow">Khu vực chủ sân</p>
          <h1>Bảng điều khiển chủ sân</h1>
          <p>Đang tải dữ liệu vận hành, doanh thu và lịch đặt gần đây...</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-page owner-workspace-grid">
        <section className="owner-hero-panel">
          <p className="eyebrow">Khu vực chủ sân</p>
          <h1>Bảng điều khiển chủ sân</h1>
          <p>{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="account-page owner-workspace-grid">
      <section className="owner-hero-panel">
        <div className="owner-hero-layout">
          <div>
            <div className="owner-shell-header">
              <div>
                <p className="eyebrow">Khu vực chủ sân</p>
                <h1>Bảng điều khiển chủ sân</h1>
                <p className="mb-0">
                  Theo dõi doanh thu, khung giờ cao điểm và các đơn đặt sân cần chú ý trong một màn
                  hình điều hành thống nhất.
                </p>
              </div>
              <div className="owner-shell-meta">
                <span>
                  <i className="bi bi-bar-chart-line"></i>
                  Tổng đơn: {bookingSummary.totalBookings}
                </span>
                <span>
                  <i className="bi bi-clock-history"></i>
                  Chờ duyệt: {bookingSummary.pendingBookings}
                </span>
              </div>
            </div>
          </div>

          <div className="owner-hero-metrics">
            <div className="owner-hero-metric">
              <span>Doanh thu tháng này</span>
              <strong>{formatOwnerCurrency(stats.monthlyRevenue)}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Đơn hôm nay</span>
              <strong>{stats.todayBookings}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Sân nổi bật</span>
              <strong>{stats.summary.topField}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Giờ cao điểm</span>
              <strong>{stats.summary.peakHour}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="owner-kpi-grid">
        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Doanh thu tháng này</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-cash-coin"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{formatOwnerCurrency(stats.monthlyRevenue)}</p>
          <span className="owner-kpi-trend">
            <i className="bi bi-arrow-up-right"></i>
            Dòng tiền đang được theo dõi tốt
          </span>
        </article>

        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Đơn hôm nay</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-calendar-check"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{stats.todayBookings}</p>
          <p className="owner-kpi-note">Giữ nhịp xử lý ổn định để khách chốt sân nhanh hơn.</p>
        </article>

        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Đơn cần xử lý</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-hourglass-split"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{bookingSummary.pendingBookings}</p>
          <span
            className={`owner-kpi-trend ${bookingSummary.pendingBookings > 0 ? 'is-warning' : ''}`}
          >
            <i className="bi bi-lightning-charge"></i>
            {bookingSummary.pendingBookings > 0
              ? 'Có đơn đang chờ phản hồi'
              : 'Không có đơn tồn đọng'}
          </span>
        </article>

        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Chất lượng dịch vụ</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-star"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{stats.summary.topField}</p>
          <p className="owner-kpi-note">Sân đang có hiệu suất tốt nhất trong dữ liệu hiện tại.</p>
        </article>
      </section>

      <section className="owner-chart-grid">
        <article className="owner-chart-panel">
          <div className="owner-panel-heading">
            <div>
              <h2>Hiệu suất theo từng sân</h2>
              <p className="owner-panel-description">
                Xem sân nào đang nhận nhiều lượt đặt nhất để tối ưu khung giờ và nhân sự.
              </p>
            </div>
            <Link className="secondary-button text-decoration-none" to="/owner/fields">
              Xem danh sách sân
            </Link>
          </div>

          {chartFieldUsage.length === 0 ? (
            <div className="owner-empty-state">Chưa có đủ dữ liệu để hiển thị hiệu suất sân.</div>
          ) : (
            <div className="owner-chart-shell">
              <ResponsiveContainer>
                <BarChart data={chartFieldUsage}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fieldName" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`${value} lượt đặt`, 'Tổng lượt đặt']} />
                  <Bar dataKey="totalBookings" radius={[12, 12, 0, 0]}>
                    {chartFieldUsage.map((entry) => (
                      <Cell key={`${entry.fieldName}-${entry.fill}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="owner-chart-panel">
          <div className="owner-panel-heading">
            <div>
              <h2>Khung giờ phổ biến</h2>
              <p className="owner-panel-description">
                Nhận biết thời điểm khách đặt nhiều để ưu tiên sân và vận hành ca trực.
              </p>
            </div>
          </div>

          {chartPeakTimes.length === 0 ? (
            <div className="owner-empty-state">Chưa có dữ liệu khung giờ cao điểm.</div>
          ) : (
            <div className="owner-chart-shell owner-chart-shell--compact">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartPeakTimes}
                    dataKey="usageCount"
                    nameKey="start_time"
                    innerRadius={52}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {chartPeakTimes.map((entry) => (
                      <Cell key={`${entry.start_time}-${entry.fill}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      `${value} lượt`,
                      item?.payload?.start_time || 'Khung giờ',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      <section className="owner-summary-grid">
        <article className="owner-table-panel">
          <div className="owner-panel-heading">
            <div>
              <h2>Đơn gần đây</h2>
              <p className="owner-panel-description">
                Tập trung vào các đơn mới nhất để biết khách đang đặt sân nào và cần phản hồi gì.
              </p>
            </div>
            <Link className="secondary-button text-decoration-none" to="/history">
              Mở lịch sử đặt sân
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="owner-empty-state">Chưa có đơn đặt sân nào để hiển thị.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Sân và khung giờ</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => {
                    const mappedStatus = statusMap[booking.status] || {
                      label: booking.status || 'Không xác định',
                      className: 'is-warning',
                    };

                    return (
                      <tr key={booking.id}>
                        <td>
                          <div className="owner-booking-field">
                            <strong>{booking.user?.name || 'Khách hàng'}</strong>
                            <span className="owner-subtle">{booking.user?.phone || '--'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="owner-booking-field">
                            <strong>{booking.field?.name || 'Chưa có tên sân'}</strong>
                            <span className="owner-subtle">
                              {formatTimeRange(booking.start_time, booking.end_time)}
                            </span>
                          </div>
                        </td>
                        <td className="fw-bold">{formatOwnerCurrency(booking.total_price)}</td>
                        <td>
                          <span className={`owner-status-pill ${mappedStatus.className}`}>
                            {mappedStatus.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <div className="owner-workspace-grid">
          <article className="owner-highlight-card">
            <div className="owner-panel-heading">
              <div>
                <h3>Điểm cần chú ý</h3>
                <p className="owner-panel-description">
                  Các tín hiệu nhanh để bạn biết hôm nay nên ưu tiên phần nào.
                </p>
              </div>
            </div>

            <div className="owner-highlight-list">
              <div className="owner-highlight-item">
                <div>
                  <strong>Sân có hiệu suất tốt nhất</strong>
                  <p className="owner-subtle">Sân đang nhận lượng đặt nổi bật trong dữ liệu.</p>
                </div>
                <span className="owner-spotlight-value">{stats.summary.topField}</span>
              </div>

              <div className="owner-highlight-item">
                <div>
                  <strong>Khung giờ đông khách</strong>
                  <p className="owner-subtle">Khung giờ nên ưu tiên kiểm tra vận hành.</p>
                </div>
                <span className="owner-spotlight-value">{stats.summary.peakHour}</span>
              </div>

              <div className="owner-highlight-item">
                <div>
                  <strong>Đơn đã xác nhận</strong>
                  <p className="owner-subtle">Số đơn đã chốt giúp ước lượng doanh thu chắc chắn.</p>
                </div>
                <span className="owner-spotlight-value">{bookingSummary.confirmedBookings}</span>
              </div>
            </div>
          </article>

          <article className="owner-mini-panel">
            <div className="owner-panel-heading">
              <div>
                <h3>Tóm tắt vận hành</h3>
                <p className="owner-panel-description">
                  Tổng hợp nhanh trạng thái các đơn hiện có trong hệ thống.
                </p>
              </div>
            </div>

            <div className="owner-mini-list">
              <div className="owner-mini-item">
                <div>
                  <strong>Chờ duyệt</strong>
                  <p className="owner-subtle">Các đơn cần phản hồi sớm.</p>
                </div>
                <span className="owner-status-pill is-warning">
                  {bookingSummary.pendingBookings}
                </span>
              </div>

              <div className="owner-mini-item">
                <div>
                  <strong>Đã duyệt</strong>
                  <p className="owner-subtle">Các đơn đã xác nhận và có thể vận hành.</p>
                </div>
                <span className="owner-status-pill is-success">
                  {bookingSummary.confirmedBookings}
                </span>
              </div>

              <div className="owner-mini-item">
                <div>
                  <strong>Đã hoàn tiền</strong>
                  <p className="owner-subtle">Các đơn cần theo dõi thêm về trải nghiệm.</p>
                </div>
                <span className="owner-status-pill is-danger">
                  {bookingSummary.refundedBookings}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboard;

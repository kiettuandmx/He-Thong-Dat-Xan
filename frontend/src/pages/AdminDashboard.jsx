import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const getAuthToken = () => {
  const authData = localStorage.getItem('user');
  if (!authData) return null;

  try {
    return JSON.parse(authData).token;
  } catch {
    return authData;
  }
};

const statCards = [
  {
    key: 'totalUsers',
    label: 'Tài khoản',
    icon: 'bi-people-fill',
    tone: 'green',
    hint: 'Bao gồm user, chủ sân và admin',
  },
  {
    key: 'totalStadiums',
    label: 'Khu sân',
    icon: 'bi-buildings-fill',
    tone: 'teal',
    hint: 'Số khu sân đang được quản lý',
  },
  {
    key: 'totalFields',
    label: 'Sân lẻ',
    icon: 'bi-grid-3x3-gap-fill',
    tone: 'blue',
    hint: 'Tổng số sân trên hệ thống',
  },
  {
    key: 'pendingFields',
    label: 'Chờ duyệt',
    icon: 'bi-hourglass-split',
    tone: 'gold',
    hint: 'Những sân cần admin xử lý ngay',
  },
];

const quickLinks = [
  {
    to: '/admin/users',
    title: 'Kiểm soát quyền truy cập',
    ariaLabel: 'Quản lý tài khoản',
    description: 'Xem, cấp role và khóa những hồ sơ bất thường cần xử lý.',
    icon: 'bi bi-person-gear',
  },
  {
    to: '/admin/stadiums',
    title: 'Duyệt khu sân',
    description: 'Kiểm tra bài đăng, duyệt và cập nhật trạng thái sân.',
    icon: 'bi bi-patch-check-fill',
  },
  {
    to: '/admin/complaints',
    title: 'Xử lý khiếu nại',
    description: 'Theo dõi case, xem ngữ cảnh và ra quyết định nhanh.',
    icon: 'bi bi-shield-exclamation',
  },
  {
    to: '/admin/activity-logs',
    title: 'Nhật ký hoạt động',
    description: 'Audit mọi thao tác quan trọng của user, owner và admin.',
    icon: 'bi bi-activity',
  },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStadiums: 0,
    totalFields: 0,
    pendingFields: 0,
  });
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAuthToken();
        const res = await axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error('Lỗi khi tải thống kê', err);
      }
    };

    fetchStats();
  }, []);

  const metrics = useMemo(
    () => statCards.map((card) => ({ ...card, value: Number(stats[card.key] || 0) })),
    [stats]
  );

  const pendingRatio = stats.totalFields
    ? Math.round((Number(stats.pendingFields || 0) / Number(stats.totalFields || 1)) * 100)
    : 0;

  const handleSendNotification = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      toast.warning('Vui lòng nhập nội dung thông báo.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/admin/send-global-notification',
        { content },
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );

      if (res.data.success) {
        toast.success('Đã phát hành thông báo thành công.');
        setContent('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không gửi được thông báo. Vui lòng kiểm tra backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-shell">
      <section className="admin-dashboard-hero">
        <div className="admin-dashboard-hero__copy">
          <p className="admin-dashboard-eyebrow">Điều hành</p>
          <h1>Bạn điều phối trung tâm cho toàn bộ hệ thống đặt sân.</h1>
          <p>
            Theo dõi nhanh tình hình vận hành và đi thẳng vào các luồng quản trị quan trọng
            nhất trong ngày.
          </p>
          <div className="admin-dashboard-hero__actions">
            <Link to="/admin/complaints" className="admin-dashboard-primary-action">
              Mở bảng khiếu nại
            </Link>
            <Link to="/admin/stadiums" className="admin-dashboard-secondary-action">
              Duyệt sân
            </Link>
          </div>
        </div>

        <div className="admin-dashboard-hero__summary">
          <span className="admin-health-chip">
            <span className="admin-health-chip__dot" />
            Hệ thống đang hoạt động ổn định
          </span>
          <strong>{pendingRatio}%</strong>
          <p>Tỷ lệ sân cần admin xử lý</p>
          <div className="admin-dashboard-hero__meta">
            <div>
              <small>Cập nhật lúc</small>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div>
              <small>Hệ thống</small>
              <span>Ổn định</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-kpi-grid">
        {metrics.map((card) => (
          <article key={card.key} className={`admin-kpi-card admin-kpi-card--${card.tone}`}>
            <div className="admin-kpi-card__icon">
              <i className={`bi ${card.icon}`} />
            </div>
            <div className="admin-kpi-card__body">
              <span>{card.label}</span>
              <h2>{card.value.toLocaleString()}</h2>
              <p>{card.hint}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-content">
        <div className="admin-dashboard-panel">
          <div className="admin-dashboard-panel__heading">
            <p>Truy cập nhanh</p>
            <h2>Các luồng quản trị quan trọng</h2>
          </div>

          <div className="admin-quick-actions-grid">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="admin-quick-action-card"
                aria-label={item.ariaLabel || item.title}
              >
                <span className="admin-quick-action-card__icon">
                  <i className={item.icon} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="admin-dashboard-panel admin-dashboard-panel--secondary">
          <div className="admin-dashboard-panel__heading">
            <p>Thông báo hệ thống</p>
            <h2>Phát thông báo đến toàn bộ người dùng</h2>
          </div>

          <form onSubmit={handleSendNotification} className="admin-broadcast-form">
            <label htmlFor="global-notification">Nội dung thông báo</label>
            <textarea
              id="global-notification"
              rows="6"
              placeholder="Ví dụ: Hệ thống sẽ bảo trì lúc 23:00 tối nay. Vui lòng hoàn tất thanh toán trước 22:45."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Đang phát thông báo...' : 'Phát thông báo ngay'}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
};

export default AdminDashboard;

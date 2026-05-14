import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const getAuthToken = () => {
  const authData = localStorage.getItem('user');
  if (!authData) return null;

  try {
    return JSON.parse(authData).token;
  } catch (error) {
    return authData;
  }
};

const statCards = [
  {
    key: 'totalUsers',
    label: 'Quan ly Tai khoan',
    icon: 'bi bi-people-fill',
    tone: 'sunrise',
    hint: 'Bao gom user, owner va admin',
  },
  {
    key: 'totalStadiums',
    label: 'Khu san',
    icon: 'bi bi-buildings-fill',
    tone: 'mint',
    hint: 'So khu san dang duoc quan ly',
  },
  {
    key: 'totalFields',
    label: 'San le',
    icon: 'bi bi-grid-3x3-gap-fill',
    tone: 'ocean',
    hint: 'Tong san con tren he thong',
  },
  {
    key: 'pendingFields',
    label: 'Cho duyet',
    icon: 'bi bi-hourglass-split',
    tone: 'amber',
    hint: 'Can admin kiem tra ngay',
  },
];

const quickLinks = [
  {
    to: '/admin/users',
    title: 'Quan ly Tai khoan',
    description: 'Xem, cap role va khoa cac tai khoan bat thuong.',
    icon: 'bi bi-person-gear',
  },
  {
    to: '/admin/stadiums',
    title: 'Duyet khu san',
    description: 'Kiem tra bai dang, duyet va cap nhat trang thai san.',
    icon: 'bi bi-patch-check-fill',
  },
  {
    to: '/admin/complaints',
    title: 'Xu ly khieu nai',
    description: 'Theo doi case, xem ngu canh va ra quyet dinh nhanh.',
    icon: 'bi bi-shield-exclamation',
  },
  {
    to: '/admin/activity-logs',
    title: 'Nhat ky hoat dong',
    description: 'Audit moi thao tac quan trong cua user, owner va admin.',
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
        console.error('Loi khi tai thong ke', err);
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
      toast.warning('Vui long nhap noi dung thong bao.');
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
        toast.success('Da phat hanh thong bao thanh cong.');
        setContent('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Khong gui duoc thong bao. Vui long kiem tra backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-shell">
      <section className="admin-hero-card">
        <div className="admin-hero-copy">
          <span className="admin-eyebrow">Control Center</span>
          <h1>Ban dieu phoi trung tam cho toan bo he thong dat san.</h1>
          <p>
            Tu day admin co the giam sat van hanh, xu ly khieu nai, phat thong bao
            va truy cap moi chuc nang nho nhat trong he thong.
          </p>
          <div className="admin-hero-actions">
            <Link to="/admin/complaints" className="admin-primary-link">
              Mo trung tam khieu nai
            </Link>
            <Link to="/admin/activity-logs" className="admin-secondary-link">
              Xem nhat ky hoat dong
            </Link>
          </div>
        </div>

        <div className="admin-hero-panel">
          <div className="hero-chip">
            <span className="hero-dot"></span>
            He thong dang hoat dong on dinh
          </div>
          <div className="hero-metric">
            <strong>{pendingRatio}%</strong>
            <span>Ty le san dang cho duyet</span>
          </div>
          <div className="hero-stack">
            <div>
              <small>Last refresh</small>
              <strong>{new Date().toLocaleString()}</strong>
            </div>
            <div>
              <small>Server</small>
              <strong>Online</strong>
            </div>
            <div>
              <small>Database</small>
              <strong>Connected</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-stats-grid">
        {metrics.map((card) => (
          <article key={card.key} className={`admin-stat-card ${card.tone}`}>
            <div className="stat-icon-wrap">
              <i className={card.icon}></i>
            </div>
            <div>
              <span>{card.label}</span>
              <h3>{card.value.toLocaleString()}</h3>
              <p>{card.hint}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-panel-card">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Truy cap nhanh</span>
              <h2>Cac luong quan tri quan trong</h2>
            </div>
          </div>

          <div className="quick-link-grid">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="quick-link-card">
                <div className="quick-link-icon">
                  <i className={item.icon}></i>
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-panel-card admin-panel-dark">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Thong diep he thong</span>
              <h2>Phat thong bao den toan bo nguoi dung</h2>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="broadcast-form">
            <label htmlFor="global-notification">Noi dung thong bao</label>
            <textarea
              id="global-notification"
              rows="6"
              placeholder="Vi du: He thong se bao tri luc 23:00 toi nay. Vui long hoan tat thanh toan truoc 22:45."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Dang phat thong bao...' : 'Phat thong bao ngay'}
            </button>
          </form>
        </div>
      </section>

      <style>{`
        .admin-dashboard-shell {
          --bg: linear-gradient(180deg, #f4efe6 0%, #f8fafc 45%, #eef5ff 100%);
          --card: rgba(255, 255, 255, 0.9);
          --line: rgba(22, 42, 77, 0.1);
          --ink: #132238;
          --muted: #5c6b80;
          --gold: #c67b2b;
          --navy: #183153;
          min-height: 100%;
          padding: 28px;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Poppins', 'Segoe UI', sans-serif;
        }

        .admin-hero-card {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
          padding: 32px;
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(245, 195, 102, 0.35), transparent 35%),
            radial-gradient(circle at bottom right, rgba(70, 133, 244, 0.18), transparent 40%),
            rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.65);
          box-shadow: 0 24px 60px rgba(25, 46, 84, 0.12);
          backdrop-filter: blur(18px);
          margin-bottom: 24px;
        }

        .admin-eyebrow,
        .panel-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(19, 34, 56, 0.08);
          color: var(--gold);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .admin-hero-copy h1 {
          margin: 16px 0 12px;
          font-size: clamp(2rem, 3.4vw, 3.2rem);
          line-height: 1.08;
          font-weight: 800;
        }

        .admin-hero-copy p {
          max-width: 640px;
          margin: 0;
          color: var(--muted);
          font-size: 1rem;
          line-height: 1.75;
        }

        .admin-hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 26px;
        }

        .admin-primary-link,
        .admin-secondary-link {
          text-decoration: none;
          font-weight: 700;
          padding: 13px 18px;
          border-radius: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .admin-primary-link {
          background: linear-gradient(135deg, #183153, #254c80);
          color: #fff;
          box-shadow: 0 16px 30px rgba(24, 49, 83, 0.24);
        }

        .admin-secondary-link {
          background: rgba(255, 255, 255, 0.86);
          color: var(--navy);
          border: 1px solid rgba(24, 49, 83, 0.12);
        }

        .admin-primary-link:hover,
        .admin-secondary-link:hover,
        .quick-link-card:hover {
          transform: translateY(-2px);
        }

        .admin-hero-panel,
        .admin-panel-card,
        .admin-stat-card {
          border: 1px solid var(--line);
        }

        .admin-hero-panel {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          padding: 22px;
          border-radius: 24px;
          background: rgba(19, 34, 56, 0.94);
          color: #f9fbff;
        }

        .hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          width: fit-content;
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.88rem;
        }

        .hero-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #7df0ae;
          box-shadow: 0 0 0 6px rgba(125, 240, 174, 0.12);
        }

        .hero-metric strong {
          display: block;
          font-size: 3rem;
          line-height: 1;
        }

        .hero-metric span,
        .hero-stack small {
          color: rgba(240, 244, 251, 0.72);
        }

        .hero-stack {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .hero-stack div {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
        }

        .hero-stack strong {
          display: block;
          margin-top: 4px;
          font-size: 0.95rem;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .admin-stat-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          border-radius: 24px;
          background: var(--card);
          box-shadow: 0 16px 36px rgba(30, 57, 94, 0.08);
        }

        .stat-icon-wrap {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .admin-stat-card span {
          display: block;
          color: var(--muted);
          font-weight: 600;
        }

        .admin-stat-card h3 {
          margin: 6px 0 2px;
          font-size: 2rem;
          font-weight: 800;
        }

        .admin-stat-card p {
          margin: 0;
          color: var(--muted);
          font-size: 0.92rem;
        }

        .sunrise .stat-icon-wrap { background: rgba(222, 127, 53, 0.14); color: #bf5e1d; }
        .mint .stat-icon-wrap { background: rgba(29, 161, 127, 0.14); color: #0f7c61; }
        .ocean .stat-icon-wrap { background: rgba(58, 123, 213, 0.14); color: #2358a4; }
        .amber .stat-icon-wrap { background: rgba(209, 145, 36, 0.14); color: #9c6704; }

        .admin-dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
        }

        .admin-panel-card {
          padding: 24px;
          border-radius: 28px;
          background: var(--card);
          box-shadow: 0 18px 44px rgba(31, 55, 91, 0.09);
        }

        .admin-panel-dark {
          background:
            radial-gradient(circle at top right, rgba(240, 173, 78, 0.18), transparent 36%),
            linear-gradient(180deg, #132238 0%, #1d3557 100%);
          color: #fff;
        }

        .panel-heading h2 {
          margin: 10px 0 0;
          font-size: 1.5rem;
          font-weight: 800;
        }

        .quick-link-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 22px;
        }

        .quick-link-card {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          padding: 18px;
          border-radius: 22px;
          background: rgba(248, 250, 255, 0.95);
          border: 1px solid rgba(24, 49, 83, 0.1);
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .quick-link-card:hover {
          box-shadow: 0 18px 36px rgba(30, 57, 94, 0.12);
        }

        .quick-link-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(24, 49, 83, 0.12), rgba(198, 123, 43, 0.16));
          color: var(--navy);
          font-size: 1.2rem;
        }

        .quick-link-card h3 {
          margin: 0 0 6px;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .quick-link-card p {
          margin: 0;
          color: var(--muted);
          line-height: 1.65;
          font-size: 0.93rem;
        }

        .broadcast-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 22px;
        }

        .broadcast-form label {
          font-size: 0.9rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
        }

        .broadcast-form textarea {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          padding: 18px;
          resize: vertical;
          min-height: 170px;
          outline: none;
        }

        .broadcast-form textarea::placeholder {
          color: rgba(230, 236, 245, 0.45);
        }

        .broadcast-form button {
          align-self: flex-start;
          padding: 13px 20px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #f1b463, #db7b35);
          color: #132238;
          font-weight: 800;
          box-shadow: 0 16px 28px rgba(219, 123, 53, 0.24);
        }

        .broadcast-form button:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        @media (max-width: 1100px) {
          .admin-hero-card,
          .admin-dashboard-grid,
          .admin-stats-grid {
            grid-template-columns: 1fr;
          }

          .hero-stack,
          .quick-link-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .admin-dashboard-shell {
            padding: 16px;
          }

          .admin-hero-card,
          .admin-panel-card {
            padding: 20px;
            border-radius: 22px;
          }

          .admin-hero-actions {
            flex-direction: column;
          }

          .admin-primary-link,
          .admin-secondary-link,
          .broadcast-form button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

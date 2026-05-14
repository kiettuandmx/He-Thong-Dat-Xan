import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const statusMap = {
  pending: { label: 'Cho xu ly', badge: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' },
  investigating: { label: 'Dang kiem tra', badge: 'bg-info-subtle text-info-emphasis border border-info-subtle' },
  resolved: { label: 'Da xu ly', badge: 'bg-success-subtle text-success-emphasis border border-success-subtle' },
  rejected: { label: 'Tu choi', badge: 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle' },
};

const resolutionOptions = [
  { value: 'refund_user', label: 'Hoan tien nguoi choi' },
  { value: 'penalize_owner', label: 'Phat chu san' },
  { value: 'no_action', label: 'Tu choi khieu nai' },
];

const getAuthToken = () => {
  const authData = localStorage.getItem('user');
  if (!authData) return null;
  try {
    return JSON.parse(authData).token;
  } catch {
    return authData;
  }
};

const formatDateTime = (value) => new Date(value).toLocaleString('vi-VN');
const formatCurrency = (value) => (value ? `${Number(value).toLocaleString('vi-VN')} đ` : '0 đ');

const ComplaintSummaryCard = ({ title, value, active, onClick, tone }) => (
  <button
    type="button"
    onClick={onClick}
    className={`summary-card text-start ${active ? 'active' : ''} ${tone}`}
  >
    <span className="summary-label">{title}</span>
    <strong className="summary-value">{value}</strong>
  </button>
);

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState({
    resolution_type: 'refund_user',
    resolution_note: '',
    penalty_amount: '',
  });

  const token = useMemo(() => getAuthToken(), []);
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await axios.get('http://localhost:5000/api/admin/complaints', {
        params,
        ...authHeader,
      });
      const nextComplaints = res.data?.data || [];
      setComplaints(nextComplaints);

      if (selected) {
        const refreshedSelected = nextComplaints.find((item) => item.id === selected.id);
        if (!refreshedSelected) {
          setSelected(null);
          setActivityLogs([]);
        }
      }
    } catch (error) {
      Swal.fire('Loi', error.response?.data?.message || 'Khong the tai khieu nai.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    try {
      const [detailRes, contextRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/complaints/${id}`, authHeader),
        axios.get(`http://localhost:5000/api/admin/complaints/${id}/activity-context`, authHeader),
      ]);

      const detail = detailRes.data?.data;
      setSelected(detail);
      setActivityLogs(contextRes.data?.data || []);
      setResolution({
        resolution_type: detail?.resolution_type || 'refund_user',
        resolution_note: detail?.resolution_note || '',
        penalty_amount: detail?.penalty_amount || '',
      });
    } catch (error) {
      Swal.fire('Loi', error.response?.data?.message || 'Khong the tai chi tiet.', 'error');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleInvestigate = async () => {
    if (!selected) return;
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/complaints/${selected.id}/status`,
        { status: 'investigating', note: 'Admin bat dau kiem tra khieu nai' },
        authHeader
      );
      await fetchComplaints();
      await fetchDetail(selected.id);
      Swal.fire('Da nhan xu ly', 'Khieu nai da chuyen sang trang thai kiem tra.', 'success');
    } catch (error) {
      Swal.fire('Loi', error.response?.data?.message || 'Khong the cap nhat.', 'error');
    }
  };

  const handleResolve = async (event) => {
    event.preventDefault();
    if (!selected) return;

    if (!resolution.resolution_note.trim()) {
      Swal.fire('Thieu ghi chu', 'Vui long nhap ghi chu xu ly.', 'warning');
      return;
    }

    try {
      setResolving(true);
      await axios.post(
        `http://localhost:5000/api/admin/complaints/${selected.id}/resolve`,
        resolution,
        authHeader
      );
      await fetchComplaints();
      await fetchDetail(selected.id);
      Swal.fire('Da xu ly', 'Quyet dinh da duoc luu vao nhat ky.', 'success');
    } catch (error) {
      Swal.fire('Loi', error.response?.data?.message || 'Khong the xu ly khieu nai.', 'error');
    } finally {
      setResolving(false);
    }
  };

  const counts = complaints.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0 }
  );

  return (
    <div className="admin-complaints-page">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">Dispute Center</span>
          <h2>Xu ly khieu nai va doi soat hoat dong</h2>
          <p>
            Theo doi tranh chap theo thoi gian thuc, xem log lien quan va ra quyet dinh
            xu ly tu mot man hinh duy nhat.
          </p>
        </div>
        <button className="btn btn-dark rounded-pill px-4 py-2" onClick={fetchComplaints}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Lam moi
        </button>
      </section>

      <section className="summary-grid">
        <ComplaintSummaryCard title="Tat ca" value={counts.total || 0} active={!statusFilter} onClick={() => setStatusFilter('')} tone="tone-neutral" />
        <ComplaintSummaryCard title="Cho xu ly" value={counts.pending || 0} active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} tone="tone-warning" />
        <ComplaintSummaryCard title="Dang kiem tra" value={counts.investigating || 0} active={statusFilter === 'investigating'} onClick={() => setStatusFilter('investigating')} tone="tone-info" />
        <ComplaintSummaryCard title="Da xu ly" value={counts.resolved || 0} active={statusFilter === 'resolved'} onClick={() => setStatusFilter('resolved')} tone="tone-success" />
        <ComplaintSummaryCard title="Tu choi" value={counts.rejected || 0} active={statusFilter === 'rejected'} onClick={() => setStatusFilter('rejected')} tone="tone-muted" />
      </section>

      <section className="content-grid">
        <div className="complaint-list-card">
          <div className="section-head">
            <div>
              <h4>Hang doi khieu nai</h4>
              <p>Chon tung case de xem bang chung, log va lich su xu ly.</p>
            </div>
            <span className="pill">{complaints.length} ho so</span>
          </div>

          <div className="complaint-list-body">
            {loading ? (
              <div className="empty-state">Dang tai danh sach khieu nai...</div>
            ) : complaints.length === 0 ? (
              <div className="empty-state">Khong co khieu nai nao trong nhom loc hien tai.</div>
            ) : (
              complaints.map((item) => {
                const status = statusMap[item.status] || statusMap.pending;
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`complaint-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => fetchDetail(item.id)}
                  >
                    <div className="row-top">
                      <strong>#{item.id}</strong>
                      <span className={`badge rounded-pill ${status.badge}`}>{status.label}</span>
                    </div>
                    <div className="row-main">
                      <div>
                        <div className="row-title">{item.user?.name || 'N/A'}</div>
                        <div className="row-subtitle">
                          {item.user?.phone || item.user?.email || 'Khong co thong tin'}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="row-title">Don #{item.booking_id || 'N/A'}</div>
                        <div className="row-subtitle">{item.field?.name || item.booking?.field?.name || 'Khong ro san'}</div>
                      </div>
                    </div>
                    <div className="row-footer">
                      <span>{formatDateTime(item.createdAt)}</span>
                      <span>{item.booking?.stadium?.name || item.stadium?.name || 'Khong ro khu san'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="detail-column">
          {!selected ? (
            <div className="blank-detail">
              <i className="bi bi-inboxes fs-1 mb-3"></i>
              <h5>Chua chon ho so</h5>
              <p>Chon mot khieu nai ben trai de xem chi tiet va bat dau xu ly.</p>
            </div>
          ) : (
            <>
              <div className="detail-card detail-hero">
                <div className="detail-head">
                  <div>
                    <span className="eyebrow">Complaint #{selected.id}</span>
                    <h4>{selected.user?.name || 'Nguoi gui khieu nai'}</h4>
                    <p>{formatDateTime(selected.createdAt)}</p>
                  </div>
                  <span className={`badge rounded-pill ${statusMap[selected.status]?.badge || ''}`}>
                    {statusMap[selected.status]?.label || selected.status}
                  </span>
                </div>

                <div className="reason-box">{selected.reason}</div>

                <div className="detail-metrics">
                  <div>
                    <span>User</span>
                    <strong>{selected.user?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Booking</span>
                    <strong>#{selected.booking_id || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Field</span>
                    <strong>{selected.field?.name || selected.booking?.field?.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Admin phu trach</span>
                    <strong>{selected.assignedAdmin?.name || 'Chua gan'}</strong>
                  </div>
                </div>

                {selected.evidence_urls?.length > 0 && (
                  <div className="evidence-list">
                    {selected.evidence_urls.map((url, index) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="evidence-pill">
                        <i className="bi bi-link-45deg"></i>
                        Bang chung {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-card">
                <div className="section-head">
                  <div>
                    <h5>Ra quyet dinh</h5>
                    <p>Cap nhat trang thai va luu ket luan xu ly vao nhat ky.</p>
                  </div>
                  {selected.status === 'pending' && (
                    <button className="btn btn-outline-primary rounded-pill" onClick={handleInvestigate}>
                      Nhan xu ly
                    </button>
                  )}
                </div>

                <form onSubmit={handleResolve} className="resolve-form">
                  <div className="form-group">
                    <label>Quyet dinh</label>
                    <select
                      className="form-select form-select-lg"
                      value={resolution.resolution_type}
                      onChange={(e) => setResolution((prev) => ({ ...prev, resolution_type: e.target.value }))}
                    >
                      {resolutionOptions.map((item) => (
                        <option value={item.value} key={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>

                  {resolution.resolution_type === 'penalize_owner' && (
                    <div className="form-group">
                      <label>So tien phat</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={resolution.penalty_amount}
                        onChange={(e) => setResolution((prev) => ({ ...prev, penalty_amount: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Ghi chu ket luan</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={resolution.resolution_note}
                      onChange={(e) => setResolution((prev) => ({ ...prev, resolution_note: e.target.value }))}
                      placeholder="Mo ta ro ket qua xac minh, huong xu ly va ly do..."
                    />
                  </div>

                  <button className="btn btn-success btn-lg rounded-pill w-100" disabled={resolving}>
                    {resolving ? 'Dang luu quyet dinh...' : 'Luu quyet dinh xu ly'}
                  </button>
                </form>
              </div>

              <div className="detail-card">
                <div className="section-head">
                  <div>
                    <h5>Log lien quan</h5>
                    <p>Toan bo hoat dong anh huong den complaint, booking, field va stadium lien quan.</p>
                  </div>
                </div>

                <div className="timeline-list">
                  {activityLogs.length === 0 ? (
                    <div className="empty-inline">Chua co log lien quan.</div>
                  ) : (
                    activityLogs.map((log) => (
                      <div className="timeline-item" key={log.id}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <strong>{log.action}</strong>
                          <span>{formatDateTime(log.createdAt)} · {log.admin?.name || 'System'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="detail-card">
                <div className="section-head">
                  <div>
                    <h5>Lich su xu ly</h5>
                    <p>Timeline cac thao tac da duoc admin thuc hien tren ho so nay.</p>
                  </div>
                </div>

                <div className="timeline-list">
                  {selected.actions?.length ? (
                    selected.actions.map((action) => (
                      <div className="timeline-item" key={action.id}>
                        <div className="timeline-dot success"></div>
                        <div className="timeline-content">
                          <strong>{action.action}</strong>
                          <span>{formatDateTime(action.createdAt)} · {action.admin?.name || 'System'}</span>
                          {action.note ? <p>{action.note}</p> : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-inline">Chua co thao tac xu ly.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <style>{`
        .admin-complaints-page {
          display: grid;
          gap: 1.5rem;
        }

        .hero-panel {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          align-items: flex-start;
          padding: 1.75rem;
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.2), transparent 28%),
            radial-gradient(circle at top right, rgba(34, 197, 94, 0.18), transparent 30%),
            linear-gradient(135deg, #fff9ec 0%, #ffffff 54%, #eefbf2 100%);
          border: 1px solid rgba(15, 23, 42, 0.07);
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.08);
        }

        .hero-panel h2 {
          margin: 0.35rem 0 0.6rem;
          font-size: clamp(1.7rem, 2.2vw, 2.4rem);
          font-weight: 800;
          color: #18212f;
        }

        .hero-panel p,
        .section-head p,
        .detail-head p {
          margin: 0;
          color: #64748b;
        }

        .eyebrow {
          font-size: 0.76rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #b45309;
          font-weight: 700;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 1rem;
        }

        .summary-card {
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 22px;
          padding: 1rem 1.1rem;
          background: #fff;
          box-shadow: 0 16px 35px rgba(15, 23, 42, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .summary-card:hover,
        .summary-card.active {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.09);
          border-color: rgba(34, 197, 94, 0.35);
        }

        .summary-label {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748b;
        }

        .summary-value {
          font-size: 1.8rem;
          color: #0f172a;
        }

        .tone-warning { background: linear-gradient(180deg, #fffdf4 0%, #ffffff 100%); }
        .tone-info { background: linear-gradient(180deg, #f4fbff 0%, #ffffff 100%); }
        .tone-success { background: linear-gradient(180deg, #f3fff7 0%, #ffffff 100%); }
        .tone-muted { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
        .tone-neutral { background: linear-gradient(180deg, #ffffff 0%, #fbfbfb 100%); }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(320px, 1.05fr) minmax(360px, 1fr);
          gap: 1.25rem;
          align-items: start;
        }

        .complaint-list-card,
        .detail-card,
        .blank-detail {
          border-radius: 28px;
          border: 1px solid rgba(15, 23, 42, 0.07);
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07);
        }

        .complaint-list-card {
          overflow: hidden;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem 1.35rem;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }

        .section-head h4,
        .section-head h5 {
          margin: 0 0 0.25rem;
          font-weight: 800;
          color: #162033;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 0.45rem 0.8rem;
          border-radius: 999px;
          background: #eef2ff;
          color: #4338ca;
          font-weight: 700;
          font-size: 0.84rem;
        }

        .complaint-list-body {
          display: grid;
          gap: 0.9rem;
          padding: 1rem;
          max-height: 900px;
          overflow: auto;
        }

        .complaint-row {
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 22px;
          padding: 1rem;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          text-align: left;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .complaint-row:hover,
        .complaint-row.selected {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.08);
          border-color: rgba(59, 130, 246, 0.28);
        }

        .row-top,
        .row-main,
        .row-footer {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .row-top {
          align-items: center;
          margin-bottom: 0.8rem;
        }

        .row-main {
          align-items: flex-start;
          margin-bottom: 0.85rem;
        }

        .row-title {
          font-weight: 700;
          color: #142033;
        }

        .row-subtitle,
        .row-footer {
          color: #64748b;
          font-size: 0.92rem;
        }

        .detail-column {
          display: grid;
          gap: 1rem;
        }

        .detail-card {
          padding: 1.25rem;
        }

        .detail-hero {
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 28%),
            linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
        }

        .detail-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .detail-head h4 {
          margin: 0.2rem 0 0.35rem;
          font-weight: 800;
          color: #162033;
        }

        .reason-box {
          padding: 1rem 1.1rem;
          border-radius: 22px;
          background: #fffaf0;
          color: #5b4a1f;
          border: 1px solid rgba(245, 158, 11, 0.18);
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .detail-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
          margin-top: 1rem;
        }

        .detail-metrics div {
          padding: 0.95rem 1rem;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid rgba(15, 23, 42, 0.05);
        }

        .detail-metrics span {
          display: block;
          margin-bottom: 0.3rem;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }

        .detail-metrics strong {
          color: #122034;
        }

        .evidence-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          margin-top: 1rem;
        }

        .evidence-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.72rem 0.95rem;
          border-radius: 999px;
          background: #eef6ff;
          color: #1d4ed8;
          font-weight: 600;
          text-decoration: none;
        }

        .resolve-form {
          display: grid;
          gap: 1rem;
        }

        .form-group {
          display: grid;
          gap: 0.45rem;
        }

        .form-group label {
          font-weight: 700;
          color: #162033;
        }

        .timeline-list {
          display: grid;
          gap: 0.9rem;
        }

        .timeline-item {
          display: grid;
          grid-template-columns: 18px 1fr;
          gap: 0.8rem;
          align-items: start;
        }

        .timeline-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          margin-top: 0.25rem;
          background: #f59e0b;
          box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.12);
        }

        .timeline-dot.success {
          background: #16a34a;
          box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
        }

        .timeline-content {
          padding: 0.95rem 1rem;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          background: #fafcff;
          display: grid;
          gap: 0.28rem;
        }

        .timeline-content strong {
          color: #0f172a;
        }

        .timeline-content span,
        .timeline-content p,
        .empty-inline,
        .empty-state,
        .blank-detail p {
          color: #64748b;
          margin: 0;
        }

        .blank-detail {
          padding: 3rem 1.5rem;
          text-align: center;
          color: #64748b;
        }

        .blank-detail h5 {
          margin-bottom: 0.45rem;
          color: #162033;
          font-weight: 800;
        }

        .empty-state {
          padding: 2rem 1rem;
          text-align: center;
        }

        @media (max-width: 1199px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 991px) {
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .hero-panel {
            flex-direction: column;
          }
        }

        @media (max-width: 575px) {
          .summary-grid,
          .detail-metrics {
            grid-template-columns: 1fr;
          }

          .row-main,
          .row-footer,
          .detail-head,
          .section-head {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminComplaints;

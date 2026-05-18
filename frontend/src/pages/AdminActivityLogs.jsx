import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin/activity-logs';

const getAuthToken = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')?.token;
  } catch {
    return null;
  }
};

const prettyJson = (value) => JSON.stringify(value, null, 2) || '{}';

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    admin_id: '',
    action: '',
    target_type: '',
    target_id: '',
    start_date: '',
    end_date: '',
  });

  const token = useMemo(() => getAuthToken(), []);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: pagination.limit };

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const res = await axios.get(API_URL, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(res.data?.data || []);
      setPagination(res.data?.pagination || pagination);
    } catch (err) {
      console.error(err);
      setError('Không thể tải nhật ký hoạt động. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setFilters({
      admin_id: '',
      action: '',
      target_type: '',
      target_id: '',
      start_date: '',
      end_date: '',
    });
    setTimeout(() => fetchLogs(1), 0);
  };

  return (
    <div className="activity-page">
      <section className="activity-hero">
        <div>
          <span className="eyebrow">Audit Trail</span>
          <h2>Nhật ký hoạt động toàn hệ thống</h2>
          <p>
            Tra cuu chi tiet tung thay doi, loc theo doi tuong, hanh dong va moc thoi gian
            de phuc vu doi soat hoac xu ly tranh chap.
          </p>
        </div>
        <div className="hero-actions">
          <span className="pill">Tổng {pagination.total} bản ghi</span>
          <button className="btn btn-dark rounded-pill px-4" onClick={() => fetchLogs(1)}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Lam moi
          </button>
        </div>
      </section>

      <section className="filter-shell">
        <form className="filter-grid" onSubmit={handleApplyFilters}>
          <div className="field-group">
            <label>Admin ID</label>
            <input type="text" className="form-control" name="admin_id" value={filters.admin_id} onChange={handleFilterChange} />
          </div>
          <div className="field-group">
            <label>Action</label>
            <input type="text" className="form-control" name="action" value={filters.action} onChange={handleFilterChange} placeholder="VD: COMPLAINT_RESOLVED" />
          </div>
          <div className="field-group">
            <label>Target Type</label>
            <input type="text" className="form-control" name="target_type" value={filters.target_type} onChange={handleFilterChange} placeholder="booking / field / stadium" />
          </div>
          <div className="field-group">
            <label>Target ID</label>
            <input type="text" className="form-control" name="target_id" value={filters.target_id} onChange={handleFilterChange} />
          </div>
          <div className="field-group">
            <label>Tu ngay</label>
            <input type="date" className="form-control" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
          </div>
          <div className="field-group">
            <label>Den ngay</label>
            <input type="date" className="form-control" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
          </div>
          <div className="filter-actions">
            <button type="button" className="btn btn-light border rounded-pill px-4" onClick={handleResetFilters}>
              Dat lai
            </button>
            <button type="submit" className="btn btn-success rounded-pill px-4">
              Loc nhat ky
            </button>
          </div>
        </form>
      </section>

      <section className="log-shell">
        {error ? <div className="alert alert-danger rounded-4 mb-4">{error}</div> : null}

        <div className="log-table-wrap">
          <div className="table-toolbar">
            <div>
              <h4>Bang ghi audit</h4>
              <p>Chon mot dong de xem before/after data day du.</p>
            </div>
            <span className="muted-note">Trang {pagination.page}/{pagination.totalPages}</span>
          </div>

          <div className="table-responsive">
            <table className="table table-modern align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Thoi gian</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th className="text-end">Chi tiet</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">Đang tải dữ liệu...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">Không có bản ghi nào phù hợp.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="fw-bold">#{log.id}</td>
                      <td>{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                      <td>
                        <div className="fw-semibold">{log.admin?.name || 'N/A'}</div>
                        <div className="small text-muted">{log.admin?.email || ''}</div>
                      </td>
                      <td>
                        <span className="action-chip">{log.action}</span>
                      </td>
                      <td>
                        <div className="fw-semibold">{log.target_type || '-'}</div>
                        <div className="small text-muted">{log.target_id ? `#${log.target_id}` : 'Không có ID'}</div>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => setSelectedLog(log)}>
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" disabled={pagination.page <= 1 || loading} onClick={() => fetchLogs(pagination.page - 1)}>
              Truoc
            </button>
            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => fetchLogs(pagination.page + 1)}>
              Sau
            </button>
          </div>
        </div>
      </section>

      {selectedLog && (
        <div className="overlay" onClick={() => setSelectedLog(null)}>
          <div className="log-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Log detail</span>
                <h4>Chi tiet log #{selectedLog.id}</h4>
                <p>{new Date(selectedLog.createdAt).toLocaleString('vi-VN')} · {selectedLog.action}</p>
              </div>
              <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setSelectedLog(null)}>
                Dong
              </button>
            </div>

            <div className="meta-grid">
              <div>
                <span>Admin</span>
                <strong>{selectedLog.admin?.name || 'N/A'}</strong>
              </div>
              <div>
                <span>Target</span>
                <strong>{selectedLog.target_type || '-'} {selectedLog.target_id ? `#${selectedLog.target_id}` : ''}</strong>
              </div>
            </div>

            <div className="json-grid">
              <div className="json-card">
                <label>Before Data</label>
                <pre>{prettyJson(selectedLog.before_data)}</pre>
              </div>
              <div className="json-card">
                <label>After Data</label>
                <pre>{prettyJson(selectedLog.after_data)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .activity-page {
          display: grid;
          gap: 1.4rem;
        }

        .activity-hero,
        .filter-shell,
        .log-table-wrap,
        .log-modal {
          border-radius: 28px;
          border: 1px solid rgba(15, 23, 42, 0.07);
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.07);
        }

        .activity-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 1.75rem;
          background:
            radial-gradient(circle at top right, rgba(30, 64, 175, 0.18), transparent 24%),
            radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.14), transparent 28%),
            linear-gradient(135deg, #eef6ff 0%, #ffffff 50%, #effcf5 100%);
        }

        .activity-hero h2 {
          margin: 0.35rem 0 0.65rem;
          font-size: clamp(1.7rem, 2.2vw, 2.4rem);
          font-weight: 800;
          color: #122033;
        }

        .activity-hero p,
        .table-toolbar p,
        .modal-head p {
          margin: 0;
          color: #64748b;
        }

        .hero-actions {
          display: grid;
          gap: 0.75rem;
          justify-items: end;
        }

        .eyebrow {
          font-size: 0.76rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #1d4ed8;
          font-weight: 700;
        }

        .pill,
        .muted-note {
          color: #475569;
          font-size: 0.9rem;
        }

        .pill {
          padding: 0.5rem 0.9rem;
          border-radius: 999px;
          background: #f1f5f9;
          font-weight: 700;
        }

        .filter-shell {
          padding: 1.25rem;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          align-items: end;
        }

        .field-group {
          display: grid;
          gap: 0.45rem;
        }

        .field-group label,
        .json-card label {
          font-weight: 700;
          color: #122033;
        }

        .filter-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .log-table-wrap {
          overflow: hidden;
        }

        .table-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem 1.35rem;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }

        .table-toolbar h4,
        .modal-head h4 {
          margin: 0 0 0.25rem;
          font-weight: 800;
          color: #122033;
        }

        .table-modern thead th {
          background: #f8fafc;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
          color: #475569;
          text-transform: uppercase;
          font-size: 0.76rem;
          letter-spacing: 0.05em;
          padding: 1rem 1rem;
        }

        .table-modern tbody td {
          padding: 1rem;
          border-color: rgba(15, 23, 42, 0.05);
        }

        .table-modern tbody tr:hover {
          background: rgba(248, 250, 252, 0.8);
        }

        .action-chip {
          display: inline-flex;
          align-items: center;
          padding: 0.45rem 0.8rem;
          border-radius: 999px;
          background: #0f172a;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .pagination-bar {
          display: flex;
          justify-content: flex-end;
          gap: 0.7rem;
          padding: 1rem 1.25rem 1.2rem;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          z-index: 1060;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .log-modal {
          width: min(1100px, 95vw);
          max-height: 90vh;
          overflow: auto;
          padding: 1.35rem;
        }

        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .meta-grid div {
          padding: 0.95rem 1rem;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid rgba(15, 23, 42, 0.05);
        }

        .meta-grid span {
          display: block;
          margin-bottom: 0.35rem;
          color: #64748b;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .json-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .json-card {
          display: grid;
          gap: 0.55rem;
        }

        .json-card pre {
          margin: 0;
          padding: 1rem;
          border-radius: 20px;
          background: #0f172a;
          color: #e2e8f0;
          min-height: 320px;
          overflow: auto;
          font-size: 0.82rem;
          line-height: 1.55;
        }

        @media (max-width: 991px) {
          .activity-hero,
          .modal-head {
            flex-direction: column;
          }

          .hero-actions {
            justify-items: start;
          }

          .filter-grid,
          .json-grid,
          .meta-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminActivityLogs;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const statusMap = {
  pending: { label: 'Cho xu ly', className: 'text-bg-warning' },
  investigating: { label: 'Dang kiem tra', className: 'text-bg-primary' },
  resolved: { label: 'Da xu ly', className: 'text-bg-success' },
  rejected: { label: 'Tu choi', className: 'text-bg-secondary' },
};

const getAuthToken = () => {
  const authData = localStorage.getItem('user');
  if (!authData) return null;
  try {
    return JSON.parse(authData).token;
  } catch (error) {
    return authData;
  }
};

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();
      const res = await axios.get('http://localhost:5000/api/complaints/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the tai danh sach khieu nai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Khieu nai cua toi</h3>
          <p className="text-muted mb-0">Theo doi trang thai xu ly tu admin.</p>
        </div>
        <button className="btn btn-outline-success" onClick={fetchComplaints}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Lam moi
        </button>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="row g-3">
        {loading ? (
          <div className="col-12 text-center py-5 text-muted">Dang tai du lieu...</div>
        ) : complaints.length === 0 ? (
          <div className="col-12">
            <div className="bg-light border rounded-3 p-5 text-center text-muted">
              Ban chua co khieu nai nao.
            </div>
          </div>
        ) : (
          complaints.map((item) => {
            const status = statusMap[item.status] || statusMap.pending;
            return (
              <div className="col-12" key={item.id}>
                <div className="bg-white border shadow-sm rounded-3 p-4">
                  <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                    <div>
                      <h6 className="fw-bold mb-1">
                        Khieu nai #{item.id}
                        {item.booking_id ? ` - Don #${item.booking_id}` : ''}
                      </h6>
                      <div className="small text-muted">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <span className={`badge align-self-start ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                    {item.reason}
                  </p>

                  <div className="row g-3 small">
                    <div className="col-md-4">
                      <span className="text-muted">San:</span>{' '}
                      <strong>{item.field?.name || item.booking?.field?.name || 'N/A'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted">Huong xu ly:</span>{' '}
                      <strong>{item.resolution_type || 'Chua co'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted">Admin:</span>{' '}
                      <strong>{item.assignedAdmin?.name || 'Chua gan'}</strong>
                    </div>
                  </div>

                  {item.resolution_note && (
                    <div className="alert alert-light border mt-3 mb-0">
                      <strong>Phan hoi admin:</strong> {item.resolution_note}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyComplaints;


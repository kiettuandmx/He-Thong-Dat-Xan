import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AccountPageHeader from '../components/AccountPageHeader';

const statusMap = {
  pending: { label: 'Chờ xử lý', className: 'text-bg-warning' },
  investigating: { label: 'Đang kiểm tra', className: 'text-bg-primary' },
  resolved: { label: 'Đã xử lý', className: 'text-bg-success' },
  rejected: { label: 'Từ chối', className: 'text-bg-secondary' },
};

const getAuthToken = () => {
  const authData = localStorage.getItem('user');
  if (!authData) return null;

  try {
    return JSON.parse(authData).token;
  } catch {
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
      const response = await axios.get('http://localhost:5000/api/complaints/my', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComplaints(response.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải danh sách khiếu nại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="account-page">
      <AccountPageHeader
        title="Khiếu nại của tôi"
        description="Theo dõi tình trạng xử lý các khiếu nại đã gửi liên quan đến lịch đặt sân hoặc giao dịch."
        action={
          <button type="button" className="secondary-button px-4 py-3" onClick={fetchComplaints}>
            Làm mới
          </button>
        }
      />

      {error && <div className="account-empty-state mb-4">{error}</div>}

      <div className="row g-3">
        {loading ? (
          <div className="col-12">
            <div className="account-empty-state">Đang tải dữ liệu khiếu nại...</div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="col-12">
            <div className="account-empty-state">
              Bạn chưa có khiếu nại nào. Khi cần hỗ trợ, khiếu nại sẽ xuất hiện tại đây.
            </div>
          </div>
        ) : (
          complaints.map((item) => {
            const status = statusMap[item.status] || statusMap.pending;
            return (
              <div key={item.id} className="col-12">
                <div className="account-card">
                  <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                    <div>
                      <h2 className="h5 fw-bold mb-1">
                        Khiếu nại #{item.id}
                        {item.booking_id ? ` - Đơn #${item.booking_id}` : ''}
                      </h2>
                      <div className="small text-muted">
                        Gửi lúc {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </div>

                  <p className="mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                    {item.reason}
                  </p>

                  <div className="row g-3 small">
                    <div className="col-md-4">
                      <span className="text-muted">Sân:</span>{' '}
                      <strong>{item.field?.name || item.booking?.field?.name || 'Không rõ'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted">Hướng xử lý:</span>{' '}
                      <strong>{item.resolution_type || 'Đang cập nhật'}</strong>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted">Admin phụ trách:</span>{' '}
                      <strong>{item.assignedAdmin?.name || 'Chưa gán'}</strong>
                    </div>
                  </div>

                  {item.resolution_note && (
                    <div className="account-empty-state text-start mt-3">
                      <strong>Phản hồi từ admin:</strong> {item.resolution_note}
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

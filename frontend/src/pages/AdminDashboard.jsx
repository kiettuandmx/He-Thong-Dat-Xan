import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const AdminDashboard = ({ user }) => { // Đảm bảo nhận prop user để kiểm tra quyền
  // --- CODE CŨ GIỮ NGUYÊN ---
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStadiums: 0,
    totalFields: 0,
    pendingFields: 0,
  });

  // --- THÊM MỚI: State cho Form gửi thông báo ---
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Lỗi khi tải thống kê', err);
      }
    };
    fetchStats();
  }, []);

  // --- CẬP NHẬT: Hàm xử lý gửi thông báo ---
  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.warning('Vui lòng nhập nội dung thông báo!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/admin/send-global-notification',
        { content }
      );

      if (res.data.success) {
        toast.success('Đã phát hành thông báo thành công!');
        setContent('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối Server! Vui lòng kiểm tra lại Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-4">Hệ thống Quản trị</h2>

      {/* --- GIỮ NGUYÊN: Hàng các thẻ thống kê --- */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary text-white p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase small">Người dùng</h6>
                <h2 className="fw-bold mb-0">{stats.totalUsers}</h2>
              </div>
              <i className="bi bi-people-fill fs-1 opacity-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase small">Tổng Stadium</h6>
                <h2 className="fw-bold mb-0">{stats.totalStadiums}</h2>
              </div>
              <i className="bi bi-building fs-1 opacity-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-dark p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase small">Sân con (Fields)</h6>
                <h2 className="fw-bold mb-0">{stats.totalFields}</h2>
              </div>
              <i className="bi bi-grid-3x3-gap-fill fs-1 opacity-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning text-dark p-3 rounded-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase small">Chờ duyệt</h6>
                <h2 className="fw-bold mb-0">{stats.pendingFields || 0}</h2>
              </div>
              <i className="bi bi-clock-history fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* --- CẬP NHẬT: Lối tắt nhanh có thêm Hoàn tiền --- */}
      <div className="row mb-5">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 h-100">
            <h5 className="fw-bold mb-3">Thao tác nhanh</h5>
            <div className="d-grid gap-2">
              <Link
                to="/admin/users"
                className="btn btn-outline-primary text-start p-3 rounded-3"
              >
                <i className="bi bi-person-gear me-2"></i> Quản lý & Phân quyền User
              </Link>
              <Link
                to="/admin/stadiums"
                className="btn btn-outline-success text-start p-3 rounded-3"
              >
                <i className="bi bi-check-circle me-2"></i> Duyệt bài đăng sân mới
              </Link>
              {/* Thêm lối tắt hoàn tiền vào đây cho tiện quản lý */}
              <Link
                to="/admin/refund-history"
                className="btn btn-outline-danger text-start p-3 rounded-3"
              >
                <i className="bi bi-cash-stack me-2"></i> Lịch sử hoàn tiền hệ thống
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-dark text-white h-100">
            <h5 className="fw-bold mb-3">Trạng thái hệ thống</h5>
            <p className="small text-secondary">
              Server: <span className="text-success">Online</span>
            </p>
            <p className="small text-secondary">
              Database: <span className="text-success">Connected</span>
            </p>
            <p className="small text-secondary">
              Last update: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* --- GIỮ NGUYÊN: Form Gửi Thông Báo Hệ Thống --- */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm p-4 rounded-4">
            <h5 className="fw-bold mb-4 text-primary">
              <i className="bi bi-megaphone-fill me-2"></i> Gửi thông báo hệ thống
            </h5>

            <form onSubmit={handleSendNotification}>
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label small fw-bold">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Nhập nội dung gửi tới mọi người dùng..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  ></textarea>
                </div>
                <div className="col-12 text-end">
                  <button
                    className="btn btn-danger px-5 py-2 fw-bold"
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Phát thông báo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Menu bổ sung (nếu cần hiển thị list riêng biệt bên dưới) */}
      {user?.role === 'admin' && (
        <div className="mt-2">
            <ul className="nav flex-column">
                <li className="nav-item">
                    <Link className="nav-link p-0 text-muted small" to="/admin/refund-history">
                        <i className="bi bi-cash-stack me-2"></i> Xem chi tiết lịch sử hoàn tiền
                    </Link>
                </li>
            </ul>
        </div>
      )}
    </div>
  );
};

AdminDashboard.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.string,
    id: PropTypes.number,
  }),
};

export default AdminDashboard;
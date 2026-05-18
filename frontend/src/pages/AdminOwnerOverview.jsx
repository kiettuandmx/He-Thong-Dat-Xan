import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const getAuthHeader = () => {
  const authData = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    Authorization: `Bearer ${authData?.token || ''}`,
  };
};

const AdminOwnerOverview = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const headers = getAuthHeader();
        const [statsRes, bookingsRes, reviewsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/stats', { headers }),
          axios.get('http://localhost:5000/api/admin/bookings', { headers }),
          axios.get('http://localhost:5000/api/reviews/owner', { headers }),
        ]);

        setStats(statsRes.data);
        setBookings(bookingsRes.data || []);
        setReviews(reviewsRes.data || []);
      } catch (error) {
        console.error('Lỗi tải bảng điều khiển vận hành admin:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const summary = useMemo(() => {
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;
    const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length;
    const refundedBookings = bookings.filter((booking) => booking.status === 'refunded').length;
    const unresolvedReviews = reviews.filter((review) => !review.owner_reply).length;

    return {
      pendingBookings,
      confirmedBookings,
      refundedBookings,
      unresolvedReviews,
    };
  }, [bookings, reviews]);

  const quickLinks = [
    { to: '/admin/owner/stadiums', label: 'Khu sân', tone: 'success' },
    { to: '/admin/owner/fields', label: 'Danh sách sân', tone: 'primary' },
    { to: '/admin/owner/bookings', label: 'Quản lý đơn', tone: 'warning' },
    { to: '/admin/owner/reviews', label: 'Đánh giá sân', tone: 'dark' },
  ];

  if (loading) {
    return <div className="text-center py-5">Đang tải bảng điều khiển vận hành...</div>;
  }

  return (
    <div className="container-fluid px-0">
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="bg-white border rounded-4 shadow-sm p-4 p-lg-5">
            <div className="row g-4 align-items-center">
              <div className="col-lg-8">
                <span className="badge text-bg-warning rounded-pill px-3 py-2 mb-3">
                  Owner Control For Admin
                </span>
                <h2 className="fw-bold mb-3">Góc nhìn vận hành của chủ sân dành cho admin.</h2>
                <p className="text-muted mb-4">
                  Admin có thể theo dõi tình hình khu sân, sân lẻ, đơn đặt và đánh giá trên
                  toàn hệ thống mà vẫn giữ nguyên dashboard admin.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {quickLinks.map((link) => (
                    <Link key={link.to} to={link.to} className={`btn btn-outline-${link.tone} rounded-pill px-3`}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <small className="text-muted d-block mb-2">Tổng người dùng</small>
                      <div className="fs-2 fw-bold">{stats?.totalUsers || 0}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <small className="text-muted d-block mb-2">Tổng khu sân</small>
                      <div className="fs-2 fw-bold">{stats?.totalStadiums || 0}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <small className="text-muted d-block mb-2">Tổng sân lẻ</small>
                      <div className="fs-2 fw-bold">{stats?.totalFields || 0}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <small className="text-muted d-block mb-2">Sân chờ duyệt</small>
                      <div className="fs-2 fw-bold">{stats?.pendingFields || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6 col-xl-3">
          <div className="bg-white border rounded-4 shadow-sm p-4 h-100">
            <small className="text-muted d-block mb-2">Đơn chờ xử lý</small>
            <div className="fs-1 fw-bold text-warning">{summary.pendingBookings}</div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="bg-white border rounded-4 shadow-sm p-4 h-100">
            <small className="text-muted d-block mb-2">Đơn đã duyệt</small>
            <div className="fs-1 fw-bold text-success">{summary.confirmedBookings}</div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="bg-white border rounded-4 shadow-sm p-4 h-100">
            <small className="text-muted d-block mb-2">Đơn đã hoàn tiền</small>
            <div className="fs-1 fw-bold text-info">{summary.refundedBookings}</div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="bg-white border rounded-4 shadow-sm p-4 h-100">
            <small className="text-muted d-block mb-2">Đánh giá chưa phản hồi</small>
            <div className="fs-1 fw-bold text-dark">{summary.unresolvedReviews}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOwnerOverview;

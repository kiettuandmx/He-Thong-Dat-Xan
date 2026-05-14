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
        console.error('Loi tai bang dieu khien van hanh admin:', error);
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
    { to: '/admin/owner/stadiums', label: 'Khu san', tone: 'success' },
    { to: '/admin/owner/fields', label: 'Danh sach san', tone: 'primary' },
    { to: '/admin/owner/bookings', label: 'Quan ly don', tone: 'warning' },
    { to: '/admin/owner/reviews', label: 'Danh gia san', tone: 'dark' },
  ];

  if (loading) {
    return <div className="text-center py-5">Dang tai bang dieu khien van hanh...</div>;
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
                <h2 className="fw-bold mb-3">Goc nhin van hanh cua chu san danh cho admin.</h2>
                <p className="text-muted mb-4">
                  Admin co the theo doi tinh hinh khu san, san le, don dat va danh gia tren
                  toan he thong ma van giu nguyen dashboard admin.
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
                      <small className="text-muted d-block mb-2">Tong nguoi dung</small>
                      <div className="fs-2 fw-bold">{stats?.totalUsers || 0}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <small className="text-muted d-block mb-2">Tong khu san</small>
                      <div className="fs-2 fw-bold">{stats?.totalStadiums || 0}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <small className="text-muted d-block mb-2">Tong san le</small>
                      <div className="fs-2 fw-bold">{stats?.totalFields || 0}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="bg-light rounded-4 p-3 h-100">
                      <small className="text-muted d-block mb-2">San cho duyet</small>
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
            <small className="text-muted d-block mb-2">Don cho xu ly</small>
            <div className="fs-1 fw-bold text-warning">{summary.pendingBookings}</div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="bg-white border rounded-4 shadow-sm p-4 h-100">
            <small className="text-muted d-block mb-2">Don da duyet</small>
            <div className="fs-1 fw-bold text-success">{summary.confirmedBookings}</div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="bg-white border rounded-4 shadow-sm p-4 h-100">
            <small className="text-muted d-block mb-2">Don da hoan tien</small>
            <div className="fs-1 fw-bold text-info">{summary.refundedBookings}</div>
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="bg-white border rounded-4 shadow-sm p-4 h-100">
            <small className="text-muted d-block mb-2">Danh gia chua phan hoi</small>
            <div className="fs-1 fw-bold text-dark">{summary.unresolvedReviews}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOwnerOverview;

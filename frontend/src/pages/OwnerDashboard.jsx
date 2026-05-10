import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';

const OwnerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ 
    todayBookings: 0, 
    monthlyRevenue: 0, 
    fieldUsage: [], // Dữ liệu biểu đồ sân
    peakTimes: []   // Dữ liệu biểu đồ giờ
  }); 
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('user'));
      const ownerId = authData.user.id;
      const headers = { Authorization: `Bearer ${authData.token}` };

      const [resBookings, resStats] = await Promise.all([
        axios.get(`http://localhost:5000/api/bookings/owner/${ownerId}`, { headers }),
        axios.get(`http://localhost:5000/api/bookings/analytics/${ownerId}`, { headers })// Gọi API analytics mới
      ]);

      setBookings(resBookings.data);
      setStats(resStats.data);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi fetch dữ liệu:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <div className="text-center mt-5">Đang tải dữ liệu dashboard...</div>;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-speedometer2 me-2"></i>Bảng điều khiển chủ sân</h2>
      
      {/* PHẦN 1: THỐNG KÊ TỔNG QUAN (CARDS) */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-primary text-white rounded-4 p-3">
            <h6 className="text-uppercase opacity-75 small">Sân sử dụng nhiều nhất</h6>
            <h4 className="fw-bold mb-0">{stats.summary?.topField || "N/A"}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-info text-white rounded-4 p-3">
            <h6 className="text-uppercase opacity-75 small">Giờ cao điểm</h6>
            <h4 className="fw-bold mb-0">{stats.summary?.peakHour || "N/A"}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white rounded-4 p-3">
            <h6 className="text-uppercase opacity-75 small">Doanh thu tháng này</h6>
            <h4 className="fw-bold mb-0">{Number(stats.monthlyRevenue || 0).toLocaleString()}đ</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm bg-warning text-dark rounded-4 p-3">
            <h6 className="text-uppercase opacity-75 small">Đơn hôm nay</h6>
            <h4 className="fw-bold mb-0">{stats.todayBookings} đơn</h4>
          </div>
        </div>
      </div>

      {/* PHẦN 2: BIỂU ĐỒ PHÂN TÍCH */}
      <div className="row mb-5">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-4">Lượt đặt theo từng sân nhỏ</h5>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={stats.fieldUsage}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fieldName" />
                  <YAxis />
                  <Tooltip cursor={{fill: '#f5f5f5'}} />
                  <Bar dataKey="totalBookings" radius={[4, 4, 0, 0]}>
                    {stats.fieldUsage?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold mb-4">Khung giờ phổ biến</h5>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.peakTimes}
                    dataKey="usageCount"
                    nameKey="start_time"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.peakTimes?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN 3: BẢNG CHI TIẾT (Giữ nguyên logic cũ của Lâm nhưng tối ưu UI) */}
      <h4 className="fw-bold mb-3">Đơn hàng gần đây</h4>
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4">Khách hàng</th>
              <th>Sân & Giờ</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th className="text-end px-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-4">
                  <div className="fw-bold">{b.user?.name}</div>
                  <small className="text-muted">{b.user?.phone}</small>
                </td>
                <td>
                  <span className="badge bg-secondary-subtle text-dark mb-1">{b.field?.name}</span>
                  <div className="small text-primary">{b.start_time} - {b.end_time}</div>
                </td>
                <td className="fw-bold">{Number(b.total_price).toLocaleString()}đ</td>
                <td>
                  <span className={`badge rounded-pill ${b.status === 'confirmed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {b.status === 'confirmed' ? 'Đã duyệt' : 'Chờ duyệt'}
                  </span>
                </td>
                <td className="text-end px-4">
                  {b.status === 'pending' && (
                    <button onClick={() => handleApprove(b.id)} className="btn btn-primary btn-sm">Duyệt</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OwnerDashboard;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Add from '../components/Add';
import Delete from '../components/Delete';

const AdminStadiums = () => {
  const [fields, setFields] = useState([]);
  const navigate = useNavigate();

  const fetchFields = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('user'));

      const res = await axios.get('http://localhost:5000/api/admin/fields', {
        headers: {
          Authorization: `Bearer ${authData?.token}`,
        },
      });

      setFields(res.data.data || res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách sân', err);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const authData = JSON.parse(localStorage.getItem('user'));

      await axios.patch(
        `http://localhost:5000/api/fields/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${authData?.token}`,
          },
        }
      );

      fetchFields();
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="container">
        {/* Header */}
        <div className="row mb-4 g-3 bg-white p-4 rounded-4 shadow-sm border mx-0 text-center">
          <div className="col-12">
            <h2 className="fw-bold text-dark mb-1">Hệ thống Quản lý Sân</h2>
          </div>

          <div className="col-12 d-flex justify-content-center">
            <div style={{ maxWidth: '400px', width: '100%' }}>
              <Add />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="row mb-4 g-3">
          <div className="col-6 col-md-3">
            <div className="p-3 bg-white rounded-3 shadow-sm border-start border-primary border-4">
              <div className="text-muted fw-bold small">Tổng số sân</div>
              <h3 className="fw-bold text-primary m-0">{fields.length}</h3>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 bg-white rounded-3 shadow-sm border-start border-warning border-4">
              <div className="text-muted fw-bold small">Đang chờ duyệt</div>
              <h3 className="fw-bold text-warning m-0">
                {fields.filter((f) => f.status === 'pending').length}
              </h3>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="row g-4">
          {fields.map((f) => (
            <div className="col-sm-12 col-md-6 col-xl-4" key={f.id}>
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100 admin-card">
                {/* Badge */}
                <div className="position-absolute top-0 end-0 m-3 z-3">
                  <span
                    className={`badge rounded-pill px-3 py-2 ${
                      f.status === 'active'
                        ? 'bg-success'
                        : f.status === 'pending'
                          ? 'bg-warning text-dark'
                          : 'bg-danger'
                    }`}
                  >
                    {f.status === 'active'
                      ? '● Đang hoạt động'
                      : f.status === 'pending'
                        ? '● Chờ duyệt'
                        : '● Đã khóa'}
                  </span>
                </div>

                {/* Image */}
                <div style={{ height: '210px' }}>
                  <img
                    src={
                      f.images?.[0]?.image_url?.startsWith('http')
                        ? f.images[0].image_url
                        : `http://localhost:5000/uploads/${
                            f.images?.[0]?.image_url || ''
                          }`
                    }
                    alt={f.name}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      e.target.src =
                        'https://via.placeholder.com/400x250?text=No+Image';
                    }}
                  />
                </div>

                {/* Body */}
                <div className="card-body d-flex flex-column p-4">
                  <h5 className="fw-bold text-dark">{f.name}</h5>

                  <div className="text-primary fw-bold fs-4 mb-3">
                    {Number(f.price_per_hour).toLocaleString()} đ
                    <small className="text-muted fs-6">/giờ</small>
                  </div>

                  <div className="bg-light border rounded-3 p-3 small mb-4 flex-grow-1">
                    <div className="mb-2">
                      📍 <strong>Khu vực:</strong> {f.stadium?.name}
                    </div>

                    <div>
                      👤 <strong>Chủ sở hữu:</strong>{' '}
                      {f.stadium?.owner?.name || 'N/A'}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-3">
                    {f.status === 'pending' ? (
                      <div className="row g-2">
                        <div className="col-6">
                          <button
                            className="btn btn-success w-100"
                            onClick={() => updateStatus(f.id, 'active')}
                          >
                            Duyệt
                          </button>
                        </div>

                        <div className="col-6">
                          <button
                            className="btn btn-outline-danger w-100"
                            onClick={() => updateStatus(f.id, 'rejected')}
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className={`btn w-100 ${
                          f.status === 'active'
                            ? 'btn-outline-warning'
                            : 'btn-outline-success'
                        }`}
                        onClick={() =>
                          updateStatus(
                            f.id,
                            f.status === 'active' ? 'rejected' : 'active'
                          )
                        }
                      >
                        {f.status === 'active' ? 'Khóa sân' : 'Mở lại sân'}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2 pt-3 border-top">
                    <button
                      className="btn btn-light border flex-grow-1 text-dark py-2"
                      onClick={() => navigate(`/admin/edit-field/${f.id}`)}
                    >
                      <i className="bi bi-pencil-square me-1 text-primary"></i>
                      Chỉnh sửa
                    </button>

                    

                    <Delete id={f.id} onSuccess={fetchFields} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .admin-card{
          transition:0.3s ease;
        }

        .admin-card:hover{
          transform:translateY(-6px);
          box-shadow:0 12px 24px rgba(0,0,0,0.08);
        }

        .object-fit-cover{
          object-fit:cover;
        }
      `}</style>
    </div>
  );
};

export default AdminStadiums;

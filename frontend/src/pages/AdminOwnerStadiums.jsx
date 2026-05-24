import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { formatLocationParts } from '../utils/locationHelpers';

const getAuthHeader = () => {
  const authData = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    Authorization: `Bearer ${authData?.token || ''}`,
  };
};

const emptyForm = {
  name: '',
  description: '',
  address: '',
  district: '',
  city: 'TP. Hồ Chí Minh',
  owner_id: '',
  status: 'active',
  location_id: '',
};

const AdminOwnerStadiums = () => {
  const [stadiums, setStadiums] = useState([]);
  const [owners, setOwners] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const headers = getAuthHeader();
      const [stadiumRes, userRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stadiums', { headers }),
        axios.get('http://localhost:5000/api/admin/users', { headers }),
      ]);

      setStadiums(stadiumRes.data || []);
      setOwners((userRes.data || []).filter((user) => Number(user.role_id) === 2));
    } catch (error) {
      console.error('Lỗi tải danh sách khu sân admin:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => {
    const activeCount = stadiums.filter((stadium) => stadium.status === 'active').length;
    return {
      total: stadiums.length,
      activeCount,
      reviewingCount: stadiums.length - activeCount,
    };
  }, [stadiums]);

  const handleEdit = (stadium) => {
    setEditingId(stadium.id);
    setFormData({
      name: stadium.name || '',
      description: stadium.description || '',
      address: stadium.location?.address || '',
      district: stadium.location?.district || '',
      city: stadium.location?.city || 'TP. Hồ Chí Minh',
      owner_id: stadium.owner_id || '',
      status: stadium.status || 'active',
      location_id: stadium.location_id || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const headers = getAuthHeader();
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        district: formData.district,
        city: formData.city,
        owner_id: Number(formData.owner_id),
        status: formData.status,
        location_id: formData.location_id || undefined,
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/stadiums/${editingId}`, payload, { headers });
      } else {
        await axios.post('http://localhost:5000/api/stadiums', payload, { headers });
      }

      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Không thể lưu khu sân.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa khu sân này?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/stadiums/${id}`, { headers: getAuthHeader() });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Không thể xóa khu sân.');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="row g-4">
        <div className="col-xl-4">
          <div className="bg-white border rounded-4 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <span className="badge text-bg-success rounded-pill px-3 py-2 mb-2">Bàn quản lý khu sân</span>
                <h3 className="fw-bold mb-1">{editingId ? 'Cập nhật khu sân' : 'Tạo khu sân mới'}</h3>
                <p className="text-muted mb-0">Admin có thể tạo và phân công khu sân cho owner.</p>
              </div>
              {editingId && (
                <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={resetForm}>
                  Hủy
                </button>
              )}
            </div>

            <form className="d-grid gap-3" onSubmit={handleSubmit}>
              <div>
                <label className="form-label fw-semibold">Tên khu sân</label>
                <input
                  className="form-control"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Owner phụ trách</label>
                <select
                  className="form-select"
                  value={formData.owner_id}
                  onChange={(event) => setFormData({ ...formData, owner_id: event.target.value })}
                  required
                >
                  <option value="">-- Chọn owner --</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} - {owner.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label fw-semibold">Địa chỉ</label>
                <input
                  className="form-control"
                  value={formData.address}
                  onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Quận / Huyện</label>
                <input
                  className="form-control"
                  value={formData.district}
                  onChange={(event) => setFormData({ ...formData, district: event.target.value })}
                  placeholder="Ví dụ: Quận 10, Thủ Đức"
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Thành phố</label>
                <input
                  className="form-control"
                  value={formData.city}
                  onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                  placeholder="TP. Hồ Chí Minh"
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Mô tả</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Trạng thái</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>

              <button className="btn btn-success rounded-pill" type="submit">
                {editingId ? 'Lưu thay đổi' : 'Tạo khu sân'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <div className="bg-white border rounded-4 shadow-sm p-3">
                <small className="text-muted d-block mb-1">Tổng khu sân</small>
                <div className="fs-2 fw-bold">{summary.total}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white border rounded-4 shadow-sm p-3">
                <small className="text-muted d-block mb-1">Đang hoạt động</small>
                <div className="fs-2 fw-bold text-success">{summary.activeCount}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white border rounded-4 shadow-sm p-3">
                <small className="text-muted d-block mb-1">Cần xem lại</small>
                <div className="fs-2 fw-bold text-warning">{summary.reviewingCount}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-4 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="fw-bold mb-1">Danh sách khu sân toàn hệ thống</h3>
                <p className="text-muted mb-0">Quản lý khu sân theo owner ngay trong dashboard admin.</p>
              </div>
            </div>

            <div className="row g-3">
              {stadiums.map((stadium) => (
                <div className="col-12" key={stadium.id}>
                  <div className="border rounded-4 p-3">
                    <div className="d-flex flex-wrap justify-content-between gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <h5 className="fw-bold mb-0">{stadium.name}</h5>
                          <span className={`badge ${stadium.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                            {stadium.status || 'inactive'}
                          </span>
                        </div>
                        <div className="text-muted small mb-1">
                          Owner: <strong>{stadium.owner?.name || 'Chưa gán'}</strong>
                        </div>
                        <div className="text-muted small mb-1">
                          Email: {stadium.owner?.email || 'N/A'}
                        </div>
                        <div className="text-muted small mb-1">
                          Địa chỉ:{' '}
                          {formatLocationParts(
                            stadium.location?.address,
                            stadium.location?.district,
                            stadium.location?.city
                          ) || 'Chưa có địa chỉ'}
                        </div>
                        <div className="small">{stadium.description || 'Chưa có mô tả'}</div>
                      </div>

                      <div className="d-flex gap-2 align-items-start">
                        <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => handleEdit(stadium)}>
                          Sửa
                        </button>
                        <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => handleDelete(stadium.id)}>
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {stadiums.length === 0 && (
                <div className="col-12 text-center text-muted py-5">Chưa có khu sân nào trong hệ thống.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOwnerStadiums;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageStadiums = () => {
  const [stadiums, setStadiums] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    location_id: '',
  });

  useEffect(() => {
    fetchStadiums();
  }, []);

  const fetchStadiums = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/stadiums');
      setStadiums(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (stadium) => {
    setIsEditing(true);
    setCurrentId(stadium.id);
    setFormData({
      name: stadium.name,
      description: stadium.description,
      address: stadium.location?.address || stadium.address || '',
      location_id: stadium.location_id || '',
      status: stadium.status || 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description,
      status: formData.status || 'active',
      address: formData.address,
      location_id: isEditing ? formData.location_id : null,
      owner_id: JSON.parse(localStorage.getItem('user'))?.user?.id || 2,
    };

    try {
      if (isEditing && currentId) {
        await axios.put(
          `http://localhost:5000/api/stadiums/${currentId}`,
          payload
        );
        alert('Cập nhật thành công!');
      } else {
        await axios.post('http://localhost:5000/api/stadiums', payload);
        alert('Thêm khu mới thành công!');
      }

      setFormData({
        name: '',
        description: '',
        address: '',
        location_id: '',
        status: 'active',
      });
      setIsEditing(false);
      setCurrentId(null);
      fetchStadiums();
    } catch (err) {
      console.error('Chi tiết lỗi:', err.response?.data);
      alert('Lỗi: ' + (err.response?.data?.error || 'Thao tác thất bại'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Xóa khu này sẽ mất hết dữ liệu sân bên trong!')) {
      try {
        await axios.delete(`http://localhost:5000/api/stadiums/${id}`);
        fetchStadiums();
      } catch (err) {
        alert('Không thể xóa!', err);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">
        🏢 {isEditing ? 'Sửa Khu Sân' : 'Quản lý Khu Sân (Stadiums)'}
      </h2>
      <div className="row">
        <div className="col-md-4">
          <div
            className={`card p-3 shadow-sm ${isEditing ? 'border-warning' : ''}`}
          >
            <h5>{isEditing ? 'Cập nhật thông tin' : 'Thêm khu mới'}</h5>
            <form onSubmit={handleSubmit}>
              <label className="small fw-bold">Tên khu sân</label>
              <input
                className="form-control mb-2"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <label className="small fw-bold">Mô tả</label>
              <textarea
                className="form-control mb-2"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <label className="small fw-bold">Địa chỉ</label>
              <input
                className="form-control mb-2"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />

              <button
                className={`btn w-100 mt-2 ${isEditing ? 'btn-warning' : 'btn-success'}`}
              >
                {isEditing ? 'Cập nhật' : 'Lưu Khu'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-link w-100 text-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentId(null);
                    setFormData({
                      name: '',
                      description: '',
                      address: '',
                      location_id: '',
                    });
                  }}
                >
                  Hủy
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="col-md-8">
          <table className="table table-hover border bg-white shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>Tên Khu</th>
                <th>Địa chỉ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {stadiums.length > 0 ? (
                stadiums.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-bold">{s.name}</td>
                    <td>
                      {s.location?.address || s.address || 'Chưa có địa chỉ'}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(s)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(s.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">
                    Chưa có dữ liệu khu sân
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageStadiums;

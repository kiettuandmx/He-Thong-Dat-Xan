import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditField = () => {
  const { id } = useParams(); // Lấy ID sân từ URL
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fieldData, setFieldData] = useState({
    name: '',
    type: 'Bóng đá',
    price_per_hour: '',
    status: 'available',
  });

  // 1. Lấy dữ liệu sân hiện tại
  useEffect(() => {
    const fetchFieldDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/fields/${id}`);
        setFieldData({
          name: res.data.name,
          type: res.data.type,
          price_per_hour: res.data.price_per_hour,
          status: res.data.status,
        });
        if (res.data.images && res.data.images.length > 0) {
          setPreview(
            `http://localhost:5000/uploads/${res.data.images[0].image_url}`
          );
        }
        setLoading(false);
      } catch (err) {
        alert('Không thể tải thông tin sân', err);
        navigate('/owner/manage-fields');
      }
    };
    fetchFieldDetail();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', fieldData.name);
    formData.append('type', fieldData.type);
    formData.append('price_per_hour', fieldData.price_per_hour);
    formData.append('status', fieldData.status);
    if (file) formData.append('image', file);

    try {
      await axios.put(`http://localhost:5000/api/fields/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Cập nhật thành công!');
      navigate(-1); // Quay lại trang trước đó
    } catch (err) {
      alert('Lỗi khi cập nhật', err);
    }
  };

  if (loading)
    return <div className="text-center mt-5">Đang tải dữ liệu...</div>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div
            className="card shadow border-0 p-4"
            style={{ borderRadius: '20px' }}
          >
            <h3 className="fw-bold text-primary mb-4">Chỉnh sửa sân bóng</h3>
            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label className="form-label fw-bold">Tên sân</label>
                <input
                  type="text"
                  className="form-control"
                  value={fieldData.name}
                  required
                  onChange={(e) =>
                    setFieldData({ ...fieldData, name: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Loại sân</label>
                <select
                  className="form-select"
                  value={fieldData.type}
                  onChange={(e) =>
                    setFieldData({ ...fieldData, type: e.target.value })
                  }
                >
                  <option value="Bóng đá">Bóng đá</option>
                  <option value="Pickleball">Pickleball</option>
                  <option value="Tennis">Tennis</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Giá (VNĐ/Giờ)</label>
                <input
                  type="number"
                  className="form-control"
                  value={fieldData.price_per_hour}
                  required
                  onChange={(e) =>
                    setFieldData({
                      ...fieldData,
                      price_per_hour: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Trạng thái</label>
                <select
                  className="form-select"
                  value={fieldData.status}
                  onChange={(e) =>
                    setFieldData({ ...fieldData, status: e.target.value })
                  }
                >
                  <option value="available">Sẵn sàng</option>
                  <option value="maintenance">Đang bảo trì</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Hình ảnh (Để trống nếu không muốn đổi)
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    className="mt-3 rounded-3 w-100"
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div className="d-flex gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1 fw-bold"
                >
                  LƯU THAY ĐỔI
                </button>
                <button
                  type="button"
                  className="btn btn-light px-4"
                  onClick={() => navigate(-1)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditField;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FIELD_TYPE_OPTIONS,
  normalizeFieldType,
} from '../constants/fieldTypes';

const EditFieldPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    price_per_hour: '',
    category: '',
    image: null,
  });

  const [preview, setPreview] = useState('');

  useEffect(() => {
    fetchField();
  }, []);

  const fetchField = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/fields/${id}`);
      const field = res.data;

      setForm({
        name: field.name,
        price_per_hour: field.price_per_hour,
        category: normalizeFieldType(field.type),
        image: null,
      });

      const img = field.images?.[0]?.image_url;
      if (img) {
        setPreview(
          img.startsWith('http') ? img : `http://localhost:5000/uploads/${img}`
        );
      }
    } catch (err) {
      alert('Lỗi tải dữ liệu');
      console.error(err);
    }
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === 'image') {
      const file = files[0];
      setForm({ ...form, image: file });

      if (file) {
        setPreview(URL.createObjectURL(file));
      }
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const authData = JSON.parse(localStorage.getItem('user'));

      const data = new FormData();
      data.append('name', form.name);
      data.append('price_per_hour', form.price_per_hour);
      data.append('type', form.category);

      if (form.image) {
        data.append('image', form.image);
      }

      await axios.put(`http://localhost:5000/api/fields/${id}`, data, {
        headers: {
          Authorization: `Bearer ${authData?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Cập nhật sân thành công');
      navigate('/admin/stadiums');
    } catch (err) {
      alert('Lỗi cập nhật sân');
      console.error(err);
    }
  };

  return (
    <div className="edit-field-wrapper py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div className="form-card shadow-lg border-0 rounded-5 bg-white overflow-hidden">
              <div className="form-header p-4 bg-primary text-white d-flex align-items-center justify-content-between shadow-sm">
                <div>
                  <h4 className="fw-bold mb-1">Chỉnh sửa thông tin</h4>
                  <p className="text-white-50 small mb-0">
                    Cập nhật thông tin chi tiết cho sân của bạn
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => navigate('/admin/stadiums')}
                ></button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 p-md-5">
                <div className="image-preview-section mb-5 text-center position-relative">
                  <label className="d-block text-muted small fw-bold text-uppercase ls-1 mb-3">
                    Hình ảnh hiện tại
                  </label>
                  {preview ? (
                    <div className="preview-container d-inline-block p-2 rounded-5 bg-light shadow-sm border">
                      <img
                        src={preview}
                        alt="Current field"
                        className="rounded-5 object-fit-cover shadow-sm"
                        style={{ width: '280px', height: '180px' }}
                      />
                    </div>
                  ) : (
                    <div
                      className="preview-placeholder rounded-5 bg-light d-flex align-items-center justify-content-center"
                      style={{ height: '180px' }}
                    >
                      <span className="text-muted italic">Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                <div className="row g-4">
                  <div className="col-12">
                    <label className="form-label fw-bold text-secondary small text-uppercase">
                      Tên sân
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 rounded-4-start">
                        <i className="bi bi-pencil-square text-primary"></i>
                      </span>
                      <input
                        type="text"
                        name="name"
                        className="form-control py-3 border-start-0 rounded-4-end shadow-none bg-light-focus"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small text-uppercase">
                      Giá mỗi giờ
                    </label>

                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 rounded-4-start">
                        <i className="bi bi-cash-stack text-success"></i>
                      </span>

                      <input
                        type="number"
                        name="price_per_hour"
                        className="form-control py-3 border-start-0 border-end-0 shadow-none bg-light-focus"
                        value={form.price_per_hour}
                        onChange={handleChange}
                        placeholder="Nhập giá thuê sân"
                        required
                      />

                      <span className="input-group-text bg-light border-0 rounded-4-end fw-bold px-3 text-dark">
                        đồng/giờ
                      </span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary small text-uppercase">
                      Danh mục
                    </label>
                    <select
                      name="category"
                      className="form-select py-3 rounded-4 shadow-none bg-light-focus cursor-pointer"
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn loại sân --</option>
                      {FIELD_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold text-secondary small text-uppercase">
                      Cập nhật ảnh mới (nếu có)
                    </label>

                    <input
                      id="uploadImage"
                      type="file"
                      name="image"
                      accept="image/*"
                      hidden
                      onChange={handleChange}
                    />

                    <button
                      type="button"
                      className="btn btn-light-soft py-3 rounded-4 w-100 fw-bold border"
                      onClick={() => document.getElementById('uploadImage').click()}
                    >
                      <i className="bi bi-camera-fill me-2 text-primary"></i>
                      Chọn hình ảnh mới
                    </button>
                  </div>

                  <div className="col-12 mt-5 d-flex gap-3">
                    <button
                      type="submit"
                      className="btn btn-primary-gradient py-3 rounded-4 flex-grow-1 fw-bold shadow-soft"
                    >
                      <i className="bi bi-cloud-check-fill me-2"></i>Cập nhật ngay
                    </button>
                    <button
                      type="button"
                      className="btn btn-light-soft py-3 rounded-4 flex-grow-1 fw-bold border"
                      onClick={() => navigate('/admin/stadiums')}
                    >
                      Quay lại
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
      .edit-field-wrapper {
        background: radial-gradient(circle at top right, #e0e7ff, #f8fafc);
        min-height: 100vh;
        font-family: var(--font-family-base);
      }

      .form-card {
        border-radius: 35px !important;
        animation: slideUp 0.5s ease-out;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .bg-light-focus:focus {
        background-color: #fff !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
      }

      .ls-1 { letter-spacing: 0.5px; }

      .preview-container {
        position: relative;
        transition: all 0.3s ease;
      }

      .preview-container:hover {
        transform: scale(1.02);
      }

      .btn-primary-gradient {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        transition: all 0.3s ease;
      }

      .btn-primary-gradient:hover {
        filter: brightness(1.1);
        transform: translateY(-2px);
      }

      .btn-light-soft {
        background-color: #f1f5f9;
        color: #475569;
        border: none;
      }

      .btn-light-soft:hover {
        background-color: #e2e8f0;
      }

      .rounded-4-start { border-radius: 12px 0 0 12px !important; }
      .rounded-4-end { border-radius: 0 12px 12px 0 !important; }
      .shadow-soft { box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2) !important; }
      .cursor-pointer { cursor: pointer; }
    `}</style>
    </div>
  );
};

export default EditFieldPage;

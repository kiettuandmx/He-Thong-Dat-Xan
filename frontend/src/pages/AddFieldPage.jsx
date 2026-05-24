import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';

const AddFieldPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    price_per_hour: '',
    category: '',
    image: null,
  });

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'image') {
      setForm({ ...form, image: files[0] });
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
      data.append('stadium_id', 1);
      if (form.image) {
        data.append('image', form.image);
      }

      await axios.post('http://localhost:5000/api/fields', data, {
        headers: {
          Authorization: `Bearer ${authData?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Thêm sân thành công');
      navigate('/admin/stadiums');
    } catch (err) {
      alert('Lỗi thêm sân');
      console.error(err);
    }
  };

  return (
    <div className="add-field-wrapper py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="form-card shadow-lg border-0 rounded-5 bg-white overflow-hidden">
              <div className="form-header p-4 bg-dark text-white d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="fw-bold mb-1">Thêm sân thể thao mới</h4>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => navigate('/admin/stadiums')}
                ></button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 p-md-5">
                <div className="row">
                  <div className="col-12 mb-4">
                    <label className="form-label fw-bold text-dark mb-2">
                      <i className="bi bi-tag me-2 text-primary"></i>Tên sân
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control custom-input py-3 rounded-4 shadow-none"
                      placeholder="VD: Sân bóng đá mini cỏ nhân tạo 6A"
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-4">
                    <label className="form-label fw-bold text-dark mb-2">
                      <i className="bi bi-cash-stack me-2 text-success"></i>
                      Giá mỗi giờ (đồng/giờ)
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        name="price_per_hour"
                        className="form-control custom-input py-3 rounded-4-start shadow-none"
                        placeholder="400000"
                        onChange={handleChange}
                        required
                      />
                      <span className="input-group-text rounded-4-end bg-light fw-bold border-0 px-3">
                        VNĐ
                      </span>
                    </div>
                  </div>

                  <div className="col-md-6 mb-4">
                    <label className="form-label fw-bold text-dark mb-2">
                      <i className="bi bi-grid me-2 text-info"></i>Loại hình
                    </label>
                    <select
                      name="category"
                      className="form-select custom-input py-3 rounded-4 shadow-none cursor-pointer"
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Chọn loại sân --</option>
                      {FIELD_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 mb-4">
                    <label className="form-label fw-bold text-dark mb-2">
                      <i className="bi bi-image me-2 text-warning"></i>Hình ảnh minh họa
                    </label>
                    <div className="upload-box p-4 border border-2 border-dashed rounded-4 text-center transition-all bg-light">
                      <i className="bi bi-cloud-arrow-up fs-1 text-muted mb-2"></i>
                      <input
                        type="file"
                        name="image"
                        className="form-control d-none"
                        id="imageUpload"
                        onChange={handleChange}
                      />
                      <label
                        htmlFor="imageUpload"
                        className="d-block text-muted cursor-pointer"
                      >
                        Kéo thả ảnh hoặc{' '}
                        <span className="text-primary fw-bold">chọn tệp</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-12 mt-4 d-flex gap-3">
                    <button
                      type="submit"
                      className="btn btn-primary py-3 rounded-4 flex-grow-1 fw-bold shadow-sm hover-up"
                    >
                      <i className="bi bi-check-circle-fill me-2"></i>Lưu thông tin
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary py-3 rounded-4 flex-grow-1 fw-bold"
                      onClick={() => navigate('/admin/stadiums')}
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
      .add-field-wrapper {
        background-color: #f0f4f8;
        min-height: 100vh;
        font-family: var(--font-family-base);
      }

      .form-card {
        border-radius: 30px !important;
      }

      .custom-input {
        border: 1px solid #e2e8f0 !important;
        background-color: #fdfdfd;
        font-size: 0.95rem;
        transition: all 0.3s ease;
      }

      .custom-input:focus {
        border-color: #3b82f6 !important;
        background-color: #fff;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
      }

      .upload-box {
        border-style: dashed !important;
        transition: all 0.2s ease;
      }

      .upload-box:hover {
        border-color: #3b82f6 !important;
        background-color: rgba(59, 130, 246, 0.05) !important;
      }

      .hover-up {
        transition: transform 0.2s ease;
      }

      .hover-up:hover {
        transform: translateY(-2px);
      }

      .rounded-4-start { border-radius: 16px 0 0 16px !important; }
      .rounded-4-end { border-radius: 0 16px 16px 0 !important; }
      .cursor-pointer { cursor: pointer; }
    `}</style>
    </div>
  );
};

export default AddFieldPage;

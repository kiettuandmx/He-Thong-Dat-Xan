import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';
import FilterSidebar from '../components/FilterSidebar';

const FieldListPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch is now handled by the FilterSidebar's onMount trigger,
    // but we can still set loading false here initially.
    setLoading(false);
  }, []);

  const handleSearchResults = (data) => {
    setFields(data);
    setLoading(false);
  };

  return (
    <div className="field-list-page w-100">
      {/* 1. Hero Banner */}
      <div
        className="position-relative d-flex align-items-center"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%), url("https://images.unsplash.com/photo-1556056504-5c7696c4c28d?q=80&w=2000")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '450px',
        }}
      >
        <div className="container px-md-5">
          <div className="row">
            <div className="col-lg-8 text-start">
              <h1 className="display-3 fw-bold text-white mb-3" style={{ lineHeight: '1.2' }}>
                S.Book - Nền tảng kết nối cộng đồng thể thao
              </h1>
              <p className="fs-5 text-white opacity-75 mb-0" style={{ maxWidth: '600px' }}>
                Tìm kiếm sân chơi thể thao một cách dễ dàng và nhanh chóng tại TP. Hồ Chí Minh.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Danh sách sân bóng */}
      <div className="container py-5 mt-4">
        <div className="d-flex align-items-center mb-5">
          <div className="bg-success rounded-circle p-2 me-3 shadow-sm">
            <i className="bi bi-geo-alt-fill text-white fs-4"></i>
          </div>
          <h2 className="fw-bold mb-0">
            Sân tập thể thao - <span className="text-success">Đặt sân gần bạn</span>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Đang tải danh sách sân...</p>
          </div>
        ) : (
          <div className="row g-4">
            {/* Sidebar Cột trái */}
            <div className="col-12 col-lg-3">
              <FilterSidebar onResults={handleSearchResults} />
            </div>
            
            {/* Danh sách sân Cột phải */}
            <div className="col-12 col-lg-9">
              <div className="row g-4">
            {fields.length > 0 ? (
              fields.map((f) => {
                // LOGIC XỬ LÝ ẢNH CHẶT CHẼ:
                // 1. Tìm ảnh trong mảng f.images có field_id trùng với f.id
                // 2. Nếu không có, lấy ảnh đầu tiên trong mảng
                // 3. Nếu mảng trống, dùng ảnh mặc định
                // Trong phần map() của FieldListPage.jsx
                const fieldImages = f.images || [];
                const firstImage = fieldImages.length > 0 ? fieldImages[0].image_url : null;

                // Thay thế đoạn imageUrl cũ bằng đoạn này
                const imageUrl = firstImage
                  ? (firstImage.startsWith('http')
                    ? firstImage
                    : `http://localhost:5000/uploads/${firstImage}`)
                  : 'https://images.unsplash.com/photo-1529900903110-33d74d1dfaff?q=80&w=800'; // Dùng ảnh sân cỏ thật làm mặc định
                return (
                  <div className="col-12 col-md-6 col-lg-4" key={f.id}>
                    <FieldCard
                      field={{
                        id: f.id,
                        name: f.name,
                        address: f.stadium?.location
                          ? `${f.stadium.location.address}, ${f.stadium.location.district}`
                          : "TP. Hồ Chí Minh",
                        type: f.type,
                        price: f.price_per_hour
                          ? Number(f.price_per_hour).toLocaleString('vi-VN')
                          : '0',
                        image: imageUrl
                      }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="col-12 text-center py-5 bg-light rounded-4">
                <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
                <p className="text-muted">Không tìm thấy sân nào phù hợp với bộ lọc.</p>
              </div>
            )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldListPage;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';

const FieldListPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/fields');
        console.log('Dữ liệu từ MySQL:', res.data);
        setFields(res.data);
      } catch (err) {
        console.error('Lỗi khi fetch dữ liệu sân:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
              <h1
                className="display-3 fw-bold text-white mb-3"
                style={{ lineHeight: '1.2' }}
              >
                S-Book - Nền tảng kết nối cộng đồng thể thao
              </h1>
              <p
                className="fs-5 text-white opacity-75 mb-0"
                style={{ maxWidth: '600px' }}
              >
                Tìm kiếm sân chơi thể thao một cách dễ dàng và nhanh chóng nhất.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Phần danh sách sân */}
      <div className="container py-5 mt-4">
        <div className="d-flex align-items-center mb-5">
          <div className="bg-success rounded-circle p-2 me-3">
            <i className="bi bi-basketball text-white fs-4"></i>
          </div>
          <h2 className="fw-bold mb-0">
            Sân tập thể thao -{' '}
            <span className="text-success">Đặt sân gần bạn</span>
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Đang tải dữ liệu từ hệ thống...</p>
          </div>
        ) : (
          <div className="row g-4">
            {fields.length > 0 ? (
              fields.map((f) => (
                <div className="col-12 col-md-6 col-lg-4" key={f.id}>
                  <FieldCard
                    field={{
                      id: f.id,
                      name: f.name,
                      address: f.stadium?.location
                        ? `${f.stadium.location.district}, ${f.stadium.location.city}`
                        : 'Địa chỉ đang cập nhật',
                      price: f.price_per_hour
                        ? Number(f.price_per_hour).toLocaleString('vi-VN')
                        : '0',
                      image:
                        f.images && f.images.length > 0
                          ? f.images[0].image_url
                          : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600',
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <p className="text-muted">Hiện tại chưa có sân nào khả dụng.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldListPage;

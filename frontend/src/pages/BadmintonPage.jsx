import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';

const BadmintonPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL Backend
  const backendUrl = 'http://localhost:5000';

  useEffect(() => {
    const fetchBadmintonFields = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/fields`);

        // Lọc dữ liệu linh hoạt
        const badmintonOnly = res.data.filter((f) => {
          const type = f.type?.toLowerCase() || '';
          return type.includes('cầu lông') || type.includes('badminton');
        });

        setFields(badmintonOnly);
      } catch (err) {
        console.error('Lỗi tải sân badminton:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBadmintonFields();
  }, []);

  return (
    <div className="container py-5">
      {/* Banner Header */}
      <div className="mb-5 p-5 bg-dark text-white rounded-5 shadow-lg position-relative overflow-hidden">
        <div className="position-relative" style={{ zIndex: 1 }}>
          <h1 className="display-4 fw-bold">Sân Cầu Lông</h1>
          <p className="lead opacity-75">
            Sân thảm chất lượng cao, trần cao thoáng mát cho lông thủ
          </p>
        </div>
        <i
          className="bi bi-shuttlecock-fill position-absolute text-info opacity-25"
          style={{
            fontSize: '200px',
            right: '-50px',
            bottom: '-50px',
            pointerEvents: 'none',
          }}
        ></i>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-2 text-muted">Đang tìm sân cầu lông...</p>
        </div>
      ) : (
        <div className="row g-4">
          {fields.length > 0 ? (
            fields.map((f) => {
              // XỬ LÝ ẢNH THÔNG MINH
              const fileName = f.images?.[0]?.image_url;
              let fullImageUrl =
                'https://images.unsplash.com/photo-1626224484214-4051d0449511?q=80&w=800'; // Ảnh cầu lông dự phòng

              if (fileName) {
                // Nếu là link web thì dùng luôn, nếu là tên file thì nối server path
                fullImageUrl = fileName.startsWith('http')
                  ? fileName
                  : `${backendUrl}/uploads/${fileName}`;
              }

              return (
                <div className="col-md-6 col-lg-4" key={f.id}>
                  <FieldCard
                    field={{
                      id: f.id,
                      name: f.name,
                      // Lấy địa chỉ từ nhiều nguồn để tránh bị trống
                      address:
                        f.stadium?.location?.address ||
                        f.address ||
                        'TP. Hồ Chí Minh',
                      type: f.type,
                       price: typeof f.price_per_hour === 'number' ? f.price_per_hour.toLocaleString('vi-VN') : f.price_per_hour,
                      image: fullImageUrl,
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center py-5">
              <i className="bi bi-search display-1 text-muted opacity-25"></i>
              <p className="text-muted fs-5 mt-3">
                Hiện chưa có sân cầu lông nào khả dụng.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BadmintonPage;

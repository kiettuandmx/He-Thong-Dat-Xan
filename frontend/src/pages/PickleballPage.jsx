import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';

const PickleballPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL Backend
  const backendUrl = 'http://localhost:5000';

  useEffect(() => {
    const fetchPickleballFields = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/fields`);

        // Lọc dữ liệu: Pickleball thường chỉ có một tên gọi duy nhất
        const pickleballOnly = res.data.filter((f) => {
          const type = f.type?.toLowerCase() || '';
          return type.includes('pickleball');
        });

        setFields(pickleballOnly);
      } catch (err) {
        console.error('Lỗi tải sân pickleball:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPickleballFields();
  }, []);

  return (
    <div className="container py-5">
      {/* Banner Header - Sử dụng tông màu Warning (Vàng/Cam) cho Pickleball */}
      <div className="mb-5 p-5 bg-dark text-white rounded-5 shadow-lg position-relative overflow-hidden">
        <div className="position-relative" style={{ zIndex: 1 }}>
          <h1 className="display-4 fw-bold">Sân Pickleball</h1>
          <p className="lead opacity-75">
            Trải nghiệm bộ môn thể thao đang hot nhất hiện nay với cơ sở vật
            chất hiện đại
          </p>
        </div>
        <i
          className="bi bi-vignette position-absolute text-warning opacity-25"
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
          <div className="spinner-border text-warning" role="status"></div>
          <p className="mt-2 text-muted">Đang tìm sân Pickleball...</p>
        </div>
      ) : (
        <div className="row g-4">
          {fields.length > 0 ? (
            fields.map((f) => {
              // XỬ LÝ ẢNH THÔNG MINH
              const fileName = f.images?.[0]?.image_url;
              // Link ảnh dự phòng chuyên về Pickleball
              let fullImageUrl =
                'https://thethaovanhoa.mediacdn.vn/372676912336973824/2025/7/29/pickleball-la-gi-vi-sao-dan-kien-truc-lai-me-pickleball-1-1753772807239492681845.png';

              if (fileName) {
                // Kiểm tra nếu là link URL tuyệt đối (http) thì không nối chuỗi backendUrl
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
                      // Ưu tiên địa chỉ từ stadium, sau đó đến address của field, cuối cùng là mặc định
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
              <i className="bi bi-emoji-frown display-1 text-muted opacity-25"></i>
              <p className="text-muted fs-5 mt-3">
                Hiện chưa có sân Pickleball nào khả dụng tại khu vực này.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PickleballPage;

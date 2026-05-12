import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';

const FootballPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL Backend
  const backendUrl = 'http://localhost:5000';

  useEffect(() => {
    const fetchFootballFields = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/fields`);

        // Cải tiến bộ lọc để bao quát nhiều trường hợp dữ liệu
        const footballOnly = res.data.filter((f) => {
          const type = f.type?.toLowerCase() || '';
          return type.includes('bóng đá') || type.includes('football');
        });

        setFields(footballOnly);
      } catch (err) {
        console.error('Lỗi tải sân bóng đá:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFootballFields();
  }, []);

  return (
    <div className="container py-5">
      {/* Banner Header */}
      <div className="mb-5 p-5 bg-dark text-white rounded-5 shadow-lg position-relative overflow-hidden">
        <div className="position-relative z-index-1">
          <h1 className="display-4 fw-bold">Sân Bóng Đá</h1>
          <p className="lead opacity-75">
            Tổng hợp những sân cỏ chất lượng nhất TP. HCM
          </p>
        </div>
        <i
          className="bi bi-patch-check-fill position-absolute text-success opacity-25"
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
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted">Đang tải danh sách sân...</p>
        </div>
      ) : (
        <div className="row g-4">
          {fields.length > 0 ? (
            fields.map((f) => {
              // Xử lý ảnh: Kiểm tra nếu image_url đã là một URL tuyệt đối hay chỉ là tên file
              const fileName = f.images?.[0]?.image_url;
              let fullImageUrl =
                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800';

              if (fileName) {
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
                      // Dùng Optional Chaining để tránh crash nếu dữ liệu lồng nhau bị null
                      address:
                        f.stadium?.location?.address ||
                        f.address ||
                        'TP. Hồ Chí Minh',
                      type: f.type,
                      price: f.price_per_hour,
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
                Hiện chưa có sân bóng đá nào khả dụng.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FootballPage;

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import FieldCard from '../components/FieldCard';
import FilterSidebar from '../components/FilterSidebar';
import { formatLocationParts } from '../utils/locationHelpers';

const SPORT_CONTENT = {
  '/': {
    eyebrow: 'Nền tảng đặt sân dành cho cộng đồng thể thao',
    title: 'Đặt sân theo phong cách thể thao hiện đại',
    description:
      'Khám phá sân phù hợp quanh bạn với hình ảnh rõ ràng, thông tin gọn và bộ lọc dễ dùng.',
  },
  '/football': {
    eyebrow: 'Khám phá sân bóng đá',
    title: 'Tìm sân bóng đá sôi động cho trận đấu tiếp theo',
    description:
      'So sánh nhanh khu vực, giá và chất lượng sân để chốt lịch đá cùng đội của bạn.',
  },
  '/badminton': {
    eyebrow: 'Khám phá sân cầu lông',
    title: 'Chọn sân cầu lông thoáng, sáng và dễ đặt',
    description:
      'Xem nhanh ảnh sân, mức giá và lịch trống để đặt được khung giờ phù hợp nhất.',
  },
  '/pickleball': {
    eyebrow: 'Khám phá sân pickleball',
    title: 'Tìm sân pickleball hiện đại cho buổi chơi tiếp theo',
    description:
      'Ưu tiên những sân có hình ảnh tốt, thông tin rõ ràng và thao tác đặt lịch thuận tiện.',
  },
};

const sportChips = [
  { to: '/football', label: 'Bóng đá' },
  { to: '/badminton', label: 'Cầu lông' },
  { to: '/pickleball', label: 'Pickleball' },
];

const FieldListPage = ({ detailBasePath = '/field' }) => {
  const location = useLocation();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const content = useMemo(
    () => SPORT_CONTENT[location.pathname] || SPORT_CONTENT['/'],
    [location.pathname]
  );

  const handleSearchResults = useCallback((data) => {
    setFields(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const handleLoadingChange = useCallback((value) => {
    setLoading(value);
  }, []);

  return (
    <div className="listing-page">
      <section className="listing-hero">
        <div className="listing-hero__content">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <div className="sport-chip-row">
            {sportChips.map((chip) => (
              <Link key={chip.to} className="sport-chip" to={chip.to}>
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="listing-context-bar">
        <div>
          <strong>{fields.length} sân phù hợp</strong>
          <div className="text-muted mt-1">Bạn có thể lọc theo môn, giá và khu vực.</div>
        </div>
        <div className="text-muted">Hình ảnh rõ ràng, thông tin gọn và thao tác đặt sân mạch lạc.</div>
      </section>

      <div className="listing-layout">
        <FilterSidebar
          defaultKeyword=""
          onLoadingChange={handleLoadingChange}
          onResults={handleSearchResults}
        />

        <section className="listing-results">
          {loading ? (
            <div className="listing-state-card">
              <h2 className="h5 fw-bold">Đang tải danh sách sân...</h2>
              <p className="mb-0 text-muted">Hệ thống đang tìm những sân phù hợp nhất cho bạn.</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="listing-state-card">
              <h2 className="h5 fw-bold">Chưa tìm thấy sân phù hợp</h2>
              <p className="mb-0 text-muted">
                Hãy thử nới rộng giá, đổi khu vực hoặc xóa bớt điều kiện lọc để xem thêm sân.
              </p>
            </div>
          ) : (
            <div className="listing-results__grid">
              {fields.map((field) => {
                const firstImage = field.images?.[0]?.image_url;
                const image = firstImage
                  ? firstImage.startsWith('http')
                    ? firstImage
                    : `http://localhost:5000/uploads/${firstImage}`
                  : 'https://images.unsplash.com/photo-1529900903110-33d74d1dfaff?q=80&w=800';

                const locationLabel = field.stadium?.location
                    ? formatLocationParts(
                      field.stadium.location.address,
                      field.stadium.location.district,
                      field.stadium.location.city
                    )
                  : field.stadium?.name || 'TP. Hồ Chí Minh';

                return (
                  <FieldCard
                    key={field.id}
                    detailPath={`${detailBasePath}/${field.id}`}
                    field={{
                      id: field.id,
                      name: field.name,
                      address: locationLabel || 'TP. Hồ Chí Minh',
                      image,
                      type: field.type,
                      price: Number(field.price_per_hour || 0),
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

FieldListPage.propTypes = {
  detailBasePath: PropTypes.string,
};

export default FieldListPage;

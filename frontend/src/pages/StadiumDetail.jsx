import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import FieldCard from '../components/FieldCard';
import { formatLocationParts } from '../utils/locationHelpers';

const getFieldImage = (field) => {
  const image = field?.images?.[0]?.image_url || field?.image_url;
  if (!image) {
    return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1600';
  }

  return image.startsWith('http') ? image : `http://localhost:5000/uploads/${image}`;
};

const StadiumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stadium, setStadium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStadium = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`http://localhost:5000/api/stadiums/${id}`);
        setStadium(response.data?.data || response.data);
      } catch (requestError) {
        console.error('Lỗi khi tải cụm sân:', requestError);
        setError('Không thể tải thông tin cụm sân. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchStadium();
  }, [id]);

  const heroImage = useMemo(() => getFieldImage(stadium?.fields?.[0]), [stadium]);
  const stadiumAddress =
    formatLocationParts(
      stadium?.address || stadium?.location?.address,
      stadium?.district || stadium?.location?.district,
      stadium?.location?.city
    ) ||
    'TP. Hồ Chí Minh';

  if (loading) {
    return (
      <div className="detail-page">
        <div className="listing-state-card">
          <h2 className="h5 fw-bold">Đang tải thông tin cơ sở...</h2>
          <p className="mb-0 text-muted">Hệ thống đang chuẩn bị danh sách sân và hình ảnh chi tiết.</p>
        </div>
      </div>
    );
  }

  if (error || !stadium) {
    return (
      <div className="detail-page">
        <div className="listing-state-card">
          <h2 className="h5 fw-bold">Không thể tải cụm sân</h2>
          <p className="mb-3 text-muted">{error || 'Không có dữ liệu để hiển thị.'}</p>
          <button type="button" className="secondary-button px-4 py-3" onClick={() => navigate('/')}>
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <section className="detail-hero" style={{ '--detail-hero-image': `url(${heroImage})` }}></section>

      <section className="detail-summary">
        <div>
          <p className="eyebrow">Cụm sân thể thao</p>
          <h1>{stadium.name}</h1>
          <p className="mb-2 text-muted">
            <i className="bi bi-geo-alt me-2 text-danger"></i>
            {stadiumAddress}
          </p>
          <div className="d-flex flex-wrap gap-2">
            <span className="field-card__badge badge-default">
              {stadium.fields?.length || 0} sân đang hoạt động
            </span>
            <span className="field-card__badge badge-football">Khám phá và đặt lịch linh hoạt</span>
          </div>
        </div>
        <div className="detail-price-box">
          <div className="small mb-1">Điểm nổi bật</div>
          <strong>{stadium.fields?.length || 0} sân</strong>
          <div className="small mt-1">để bạn lựa chọn</div>
        </div>
      </section>

      <section className="detail-grid">
        <article className="detail-panel">
          <h2 className="h4 fw-bold mb-3">Giới thiệu cơ sở</h2>
          <p className="text-muted mb-4">
            {stadium.description ||
              'Cơ sở này đang cung cấp nhiều lựa chọn sân để bạn dễ dàng so sánh hình ảnh, giá và lịch trống trước khi đặt.'}
          </p>

          <div className="detail-meta-list">
            <div>
              <strong>Địa chỉ:</strong> {stadiumAddress}
            </div>
            <div>
              <strong>Khu vực:</strong> {stadium.district || stadium.location?.district || 'TP. Hồ Chí Minh'}
            </div>
            <div>
              <strong>Liên hệ:</strong> {stadium.phone || 'Đang cập nhật'}
            </div>
          </div>
        </article>

        <aside className="detail-panel detail-panel--sticky">
          <h2 className="h4 fw-bold mb-3">Danh sách sân trong cụm</h2>
          <p className="text-muted mb-0">
            Chọn sân phù hợp để xem lịch trống, giá theo giờ và tiến hành đặt lịch ngay.
          </p>
        </aside>
      </section>

      <section className="mt-4">
        {stadium.fields?.length ? (
          <div className="listing-results__grid">
            {stadium.fields.map((field) => (
              <FieldCard
                key={field.id}
                detailPath={`/field/${field.id}`}
                field={{
                  id: field.id,
                  name: field.name,
                  address: stadiumAddress,
                  image: getFieldImage(field),
                  price: Number(field.price_per_hour || 0),
                  type: field.type,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="account-empty-state mt-3">
            Cơ sở này chưa có sân nào để hiển thị. Vui lòng quay lại sau.
          </div>
        )}
      </section>
    </div>
  );
};

export default StadiumDetail;

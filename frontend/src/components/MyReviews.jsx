import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AccountPageHeader from './AccountPageHeader';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyReviews = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem('user') || 'null');
        const token = authData?.token || authData;
        const response = await axios.get('http://localhost:5000/api/reviews/my-reviews', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviews(response.data || []);
      } catch (error) {
        console.error('Lỗi khi tải đánh giá của tôi:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReviews();
  }, []);

  return (
    <div className="account-page">
      <AccountPageHeader
        title="Đánh giá của tôi"
        description="Xem lại những nhận xét bạn đã gửi để theo dõi trải nghiệm đặt sân và hỗ trợ chủ sân cải thiện dịch vụ."
      />

      {loading ? (
        <div className="account-empty-state">Đang tải đánh giá của bạn...</div>
      ) : reviews.length === 0 ? (
        <div className="account-empty-state">
          Bạn chưa để lại đánh giá nào. Sau khi hoàn tất một lượt chơi, bạn có thể quay lại để chia sẻ trải nghiệm.
        </div>
      ) : (
        <div className="row g-3">
          {reviews.map((review) => (
            <div key={review.id} className="col-md-6">
              <div className="account-card h-100">
                <div className="d-flex justify-content-between gap-3 flex-wrap">
                  <h2 className="h5 fw-bold mb-0">
                    {review.booking?.stadium?.name || 'Cụm sân thể thao'}
                  </h2>
                  <small className="text-muted">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </small>
                </div>

                <div className="text-warning my-3">{'★'.repeat(review.rating)}</div>
                <p className="mb-3">{review.comment}</p>
                <div className="small text-muted">
                  Đơn ngày {review.booking?.booking_date} lúc{' '}
                  {review.booking?.start_time?.substring(0, 5) || '--:--'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;

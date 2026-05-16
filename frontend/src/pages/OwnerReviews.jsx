import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const formatReviewDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN');
};

const OwnerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState('');
  const token = JSON.parse(localStorage.getItem('user') || 'null')?.token;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get('http://localhost:5000/api/reviews/owner', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextReviews = Array.isArray(res.data) ? res.data : [];
      setReviews(nextReviews);
      setReplyDrafts((current) => {
        const merged = { ...current };
        nextReviews.forEach((review) => {
          if (merged[review.id] === undefined) {
            merged[review.id] = review.owner_reply || '';
          }
        });
        return merged;
      });
    } catch (requestError) {
      console.error('Lỗi lấy danh sách đánh giá:', requestError);
      setError('Không thể tải đánh giá khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const reviewSummary = useMemo(() => {
    const total = reviews.length;
    const replied = reviews.filter((review) => Boolean(review.owner_reply)).length;
    const pending = total - replied;
    const average =
      total > 0
        ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total).toFixed(1)
        : '0.0';

    return { total, replied, pending, average };
  }, [reviews]);

  const handleDraftChange = (reviewId, value) => {
    setReplyDrafts((current) => ({
      ...current,
      [reviewId]: value,
    }));
  };

  const handleReply = async (reviewId) => {
    const ownerReply = replyDrafts[reviewId]?.trim();
    if (!ownerReply) return;

    setSubmittingId(reviewId);
    try {
      await axios.patch(
        `http://localhost:5000/api/reviews/${reviewId}/reply`,
        { owner_reply: ownerReply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchReviews();
    } catch (requestError) {
      console.error('Lỗi phản hồi đánh giá:', requestError);
      setError(
        requestError?.response?.data?.message ||
          'Không thể gửi phản hồi lúc này. Vui lòng thử lại.'
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="account-page owner-workspace-grid">
      <section className="owner-hero-panel">
        <div className="owner-hero-layout">
          <div>
            <p className="eyebrow">Service Quality</p>
            <h1>Đánh giá khách hàng</h1>
            <p className="mb-0">
              Theo dõi cảm nhận của khách, nhận diện sân có trải nghiệm chưa tốt và phản hồi sớm
              để giữ chất lượng dịch vụ ổn định.
            </p>
          </div>
          <div className="owner-hero-metrics">
            <div className="owner-hero-metric">
              <span>Điểm trung bình</span>
              <strong>{reviewSummary.average}/5</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Tổng đánh giá</span>
              <strong>{reviewSummary.total}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Đã phản hồi</span>
              <strong>{reviewSummary.replied}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Cần xử lý</span>
              <strong>{reviewSummary.pending}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="owner-kpi-grid">
        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Chất lượng dịch vụ</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-heart-pulse"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{reviewSummary.average}/5</p>
          <p className="owner-kpi-note">Điểm số này phản ánh cảm nhận tổng thể của khách hàng.</p>
        </article>

        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Đánh giá mới</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-chat-dots"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{reviewSummary.total}</p>
          <p className="owner-kpi-note">Tất cả phản hồi hiện có của khách về sân trong hệ thống.</p>
        </article>

        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Đã phản hồi</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-reply"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{reviewSummary.replied}</p>
          <p className="owner-kpi-note">Những đánh giá đã được bạn chăm sóc và phản hồi.</p>
        </article>

        <article className="owner-kpi-card">
          <div className="owner-kpi-card__meta">
            <p className="owner-kpi-card__label">Cần xử lý</p>
            <span className="owner-kpi-card__icon">
              <i className="bi bi-lightning-charge"></i>
            </span>
          </div>
          <p className="owner-kpi-value">{reviewSummary.pending}</p>
          <p className="owner-kpi-note">Ưu tiên các phản hồi chưa được trả lời để tăng độ tin cậy.</p>
        </article>
      </section>

      {error ? <div className="owner-empty-state">{error}</div> : null}

      {loading ? (
        <div className="owner-empty-state">Đang tải đánh giá khách hàng...</div>
      ) : reviews.length === 0 ? (
        <div className="owner-empty-state">Chưa có đánh giá nào cần xử lý.</div>
      ) : (
        <section className="owner-review-grid">
          {reviews.map((review) => (
            <article key={review.id} className="owner-review-panel">
              <div className="owner-review-header">
                <div>
                  <span className="owner-rating-pill">
                    <i className="bi bi-star-fill"></i>
                    {review.rating}/5
                  </span>
                  <h2 className="h5 fw-bold mt-3 mb-2">{review.field?.name || 'Sân chưa đặt tên'}</h2>
                  <p className="owner-subtle mb-0">
                    {review.user?.name || 'Khách hàng'} • {formatReviewDate(review.createdAt)}
                  </p>
                </div>
                {review.owner_reply ? (
                  <span className="owner-status-pill is-success">Đã phản hồi</span>
                ) : (
                  <span className="owner-status-pill is-warning">Chờ phản hồi</span>
                )}
              </div>

              <div className="owner-review-comment">
                <strong className="d-block mb-2">Nhận xét của khách</strong>
                <p className="mb-0">{review.comment || 'Khách chưa để lại nhận xét chi tiết.'}</p>
              </div>

              {review.owner_reply ? (
                <div className="owner-review-reply">
                  <strong className="d-block mb-2">Phản hồi của bạn</strong>
                  <p className="mb-0">{review.owner_reply}</p>
                </div>
              ) : null}

              <div className="owner-review-actions">
                <label className="filter-label" htmlFor={`reply-${review.id}`}>
                  {review.owner_reply ? 'Cập nhật phản hồi' : 'Viết phản hồi cho khách'}
                </label>
                <textarea
                  id={`reply-${review.id}`}
                  className="filter-input"
                  placeholder="Cảm ơn khách đã chia sẻ trải nghiệm và cho họ biết bạn đang cải thiện điều gì."
                  value={replyDrafts[review.id] || ''}
                  onChange={(event) => handleDraftChange(review.id, event.target.value)}
                />
                <div className="owner-review-actions-row">
                  <p className="owner-subtle mb-0">
                    Phản hồi rõ ràng, lịch sự và có hướng xử lý sẽ giúp giữ chân khách tốt hơn.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={submittingId === review.id || !replyDrafts[review.id]?.trim()}
                    onClick={() => handleReply(review.id)}
                  >
                    {submittingId === review.id
                      ? 'Đang lưu...'
                      : review.owner_reply
                        ? 'Lưu phản hồi'
                        : 'Gửi phản hồi'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default OwnerReviews;

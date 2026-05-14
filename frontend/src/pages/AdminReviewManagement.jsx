import React, { useEffect, useState } from 'react';
import axios from 'axios';

const getAuthHeader = () => {
  const authData = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    Authorization: `Bearer ${authData?.token || ''}`,
  };
};

const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});

  const loadReviews = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reviews/owner', {
        headers: getAuthHeader(),
      });
      const reviewList = res.data || [];
      setReviews(reviewList);
      setReplyDrafts(
        reviewList.reduce((acc, review) => {
          acc[review.id] = review.owner_reply || '';
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Loi tai danh sach danh gia admin:', error);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const submitReply = async (reviewId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/reviews/${reviewId}/reply`,
        { owner_reply: replyDrafts[reviewId] || '' },
        { headers: getAuthHeader() }
      );
      loadReviews();
    } catch (error) {
      alert(error.response?.data?.message || 'Khong the gui phan hoi danh gia.');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="bg-white border rounded-4 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">Quan ly danh gia san</h3>
            <p className="text-muted mb-0">Admin xem toan bo danh gia va phan hoi ngay tren giao dien rieng.</p>
          </div>
          <span className="badge text-bg-dark rounded-pill px-3 py-2">{reviews.length} danh gia</span>
        </div>

        <div className="row g-3">
          {reviews.map((review) => (
            <div key={review.id} className="col-12">
              <div className="border rounded-4 p-4">
                <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                  <div>
                    <div className="fw-bold">{review.user?.name || 'Khach hang'}</div>
                    <div className="small text-muted">
                      {review.field?.stadium?.name || 'N/A'} - {review.field?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-warning">{'★'.repeat(review.rating || 0)}</div>
                    <div className="small text-muted">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="bg-light rounded-4 p-3 mb-3">{review.comment || 'Khong co noi dung.'}</div>

                <div className="row g-3 align-items-end">
                  <div className="col-lg-10">
                    <label className="form-label fw-semibold">Phan hoi cua admin</label>
                    <input
                      className="form-control"
                      value={replyDrafts[review.id] || ''}
                      onChange={(event) =>
                        setReplyDrafts({ ...replyDrafts, [review.id]: event.target.value })
                      }
                      placeholder="Nhap noi dung phan hoi..."
                    />
                  </div>
                  <div className="col-lg-2">
                    <button className="btn btn-success w-100 rounded-pill" onClick={() => submitReply(review.id)}>
                      {review.owner_reply ? 'Cap nhat' : 'Phan hoi'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="col-12 text-center text-muted py-5">Chua co danh gia nao trong he thong.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewManagement;

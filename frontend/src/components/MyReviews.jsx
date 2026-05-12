import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyReviews = async () => {
            try {
                const authData = JSON.parse(localStorage.getItem('user'));
                const token = authData?.token || authData;
                const res = await axios.get('http://localhost:5000/api/reviews/my-reviews', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReviews(res.data);
            } catch (err) {
                console.error("Lỗi lấy đánh giá:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyReviews();
    }, []);

    if (loading) return <div className="text-center mt-5">Đang tải đánh giá...</div>;

    return (
        <div className="container mt-5">
            <h4 className="fw-bold mb-4">⭐ Những đánh giá của bạn</h4>
            <div className="row g-3">
                {reviews.length > 0 ? (
                    reviews.map(rev => (
                        <div key={rev.id} className="col-md-6">
                            <div className="card border-0 shadow-sm p-3 rounded-4">
                                <div className="d-flex justify-content-between">
                                    <h6 className="fw-bold text-success">
                                        {rev.booking?.stadium?.name || "Sân bóng"}
                                    </h6>
                                    <small className="text-muted">
                                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                                    </small>
                                </div>
                                <div className="text-warning mb-2">{'⭐'.repeat(rev.rating)}</div>
                                <p className="text-secondary small bg-light p-2 rounded-3">
                                    "{rev.comment}"
                                </p>
                                <div className="mt-2 text-muted" style={{ fontSize: '0.75rem' }}>
                                    Đơn ngày: {rev.booking?.booking_date} | {rev.booking?.start_time.substring(0,5)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-5">Bạn chưa để lại đánh giá nào.</div>
                )}
            </div>
        </div>
    );
};

export default MyReviews;
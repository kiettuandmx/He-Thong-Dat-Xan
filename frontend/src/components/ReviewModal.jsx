import React, { useState } from 'react';
import axios from 'axios';

const ReviewModal = ({ bookingId, onClose, onRefresh }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
        alert("Vui lòng nhập nhận xét!");
        return;
    }
    try {
      setLoading(true);
      const authData = localStorage.getItem('user');
      const token = authData ? (JSON.parse(authData).token || authData) : null;

      await axios.post('http://localhost:5000/api/reviews/create', 
        { booking_id: bookingId, rating: Number(rating), comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Cảm ơn bạn đã đánh giá!");
      onRefresh(); 
      onClose();   
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi gửi đánh giá!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Lớp nền mờ phía sau */}
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      
      {/* Nội dung Modal */}
      <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'transparent' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow-lg border-0 rounded-4">
            <div className="modal-header bg-warning text-dark rounded-top-4">
              <h5 className="modal-title fw-bold">⭐ Đánh giá sân bóng</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label fw-bold">Số sao:</label>
                <select 
                  className="form-select border-2" 
                  value={rating} 
                  onChange={(e) => setRating(e.target.value)}
                >
                  {[5, 4, 3, 2, 1].map(num => (
                    <option key={num} value={num}>{num} Sao {num === 5 ? ' - Tuyệt vời' : ''}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Nhận xét của bạn:</label>
                <textarea 
                  className="form-control border-2" 
                  rows="4"
                  placeholder="Sân bóng chất lượng thế nào, dịch vụ tốt không?..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)} 
                />
              </div>
            </div>

            <div className="modal-footer border-0 p-3">
              <button className="btn btn-light rounded-pill px-4" onClick={onClose}>Hủy</button>
              <button 
                className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewModal;
import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const getAuthToken = () => {
  const authData = localStorage.getItem('user');
  if (!authData) return null;
  try {
    return JSON.parse(authData).token;
  } catch (error) {
    return authData;
  }
};

const ComplaintModal = ({ booking, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập nội dung khiếu nại.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();
      await axios.post(
        'http://localhost:5000/api/complaints',
        {
          booking_id: booking?.id,
          stadium_id: booking?.stadium_id,
          field_id: booking?.field_id,
          reason,
          evidence_urls: evidence,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire('Đã gửi', 'Khiếu nại của bạn đã được gửi đến admin.', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể gửi khiếu nại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15,23,42,0.48)', zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="bg-white shadow rounded-3 p-4"
        style={{ width: 'min(620px, 94vw)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="fw-bold mb-1">Gửi khiếu nại</h5>
            <p className="text-muted small mb-0">
              Đơn #{booking?.id} - {booking?.field?.name || 'Sân đã đặt'}
            </p>
          </div>
          <button className="btn btn-light btn-sm border" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Nội dung khiếu nại</label>
            <textarea
              className="form-control"
              rows="5"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mo ta ro van de: thoi gian, san, tinh huong va mong muon xu ly..."
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Bang chung / link anh</label>
            <textarea
              className="form-control"
              rows="3"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Moi dong mot link anh/chung tu neu co"
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light border" onClick={onClose}>
              Huy
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintModal;

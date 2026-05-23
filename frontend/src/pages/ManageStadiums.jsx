import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import StadiumHashtagModal from '../components/StadiumHashtagModal';
import { formatLocationParts } from '../utils/locationHelpers';

const getAuthToken = () => {
  const authData = JSON.parse(localStorage.getItem('user') || '{}');
  return authData?.token || null;
};

const getCurrentUserId = () =>
  JSON.parse(localStorage.getItem('user') || '{}')?.user?.id;

const ManageStadiums = () => {
  const [stadiums, setStadiums] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    district: '',
    city: 'TP. Hồ Chí Minh',
    location_id: '',
    status: 'active',
  });
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState(null);

  useEffect(() => {
    fetchStadiums();
  }, []);

  const fetchStadiums = async () => {
    try {
      const ownerId = getCurrentUserId();
      const token = getAuthToken();
      const res = await axios.get(`http://localhost:5000/api/stadiums/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStadiums(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error(err);
      setStadiums([]);
    }
  };

  const summary = useMemo(() => {
    const activeCount = stadiums.filter((stadium) => stadium.status === 'active').length;
    const otherCount = stadiums.length - activeCount;

    return {
      total: stadiums.length,
      activeCount,
      otherCount,
    };
  }, [stadiums]);

  const handleEdit = (stadium) => {
    setIsEditing(true);
    setCurrentId(stadium.id);
    setFormData({
      name: stadium.name,
      description: stadium.description,
      address: stadium.location?.address || stadium.address || '',
      district: stadium.location?.district || '',
      city: stadium.location?.city || 'TP. Hồ Chí Minh',
      location_id: stadium.location_id || '',
      status: stadium.status || 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      district: '',
      city: 'TP. Hồ Chí Minh',
      location_id: '',
      status: 'active',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description,
      status: formData.status || 'active',
      address: formData.address,
      district: formData.district,
      city: formData.city,
      location_id: isEditing ? formData.location_id : null,
      owner_id: getCurrentUserId(),
    };

    try {
      const token = getAuthToken();
      if (isEditing && currentId) {
        await axios.put(`http://localhost:5000/api/stadiums/${currentId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Cập nhật thành công!');
      } else {
        await axios.post('http://localhost:5000/api/stadiums', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Thêm khu mới thành công!');
      }

      resetForm();
      fetchStadiums();
    } catch (err) {
      alert(err.response?.data?.error || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa khu này sẽ mất hết dữ liệu sân bên trong!')) return;

    try {
      const token = getAuthToken();
      await axios.delete(`http://localhost:5000/api/stadiums/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStadiums();
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể xóa!');
    }
  };

  return (
    <div className="stadium-workspace">
      <section className="workspace-hero">
        <div>
          <span className="workspace-tag">Owner Studio</span>
          <h1>Quản lý khu sân bằng một không gian gọn, đẹp và dễ vận hành.</h1>
          <p>
            Thêm khu mới, sửa thông tin, gắn hashtag và theo dõi trạng thái ngay trên
            cùng một màn hình.
          </p>
        </div>

        <div className="workspace-summary">
          <div>
            <small>Tổng khu sân</small>
            <strong>{summary.total}</strong>
          </div>
          <div>
            <small>Đang hoạt động</small>
            <strong>{summary.activeCount}</strong>
          </div>
          <div>
            <small>Cần xem lại</small>
            <strong>{summary.otherCount}</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <article className="workspace-card workspace-form-card">
          <div className="card-head">
            <div>
              <span className="mini-kicker">{isEditing ? 'Edit mode' : 'Create mode'}</span>
              <h2>{isEditing ? 'Cập nhật khu sân' : 'Thêm khu sân mới'}</h2>
            </div>
            {isEditing && (
              <button type="button" className="ghost-button" onClick={resetForm}>
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="workspace-form">
            <label>Tên khu sân</label>
            <input
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
            />

            <label>Mô tả ngắn</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(event) =>
                setFormData({ ...formData, description: event.target.value })
              }
              placeholder="Mô tả điểm nổi bật, dịch vụ, giờ mở cửa..."
            />

            <label>Địa chỉ</label>
            <input
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              required
            />

            <label>Quận / Huyện</label>
            <input
              value={formData.district}
              onChange={(event) => setFormData({ ...formData, district: event.target.value })}
              placeholder="Ví dụ: Quận 10, Thủ Đức"
            />

            <label>Thành phố</label>
            <input
              value={formData.city}
              onChange={(event) => setFormData({ ...formData, city: event.target.value })}
              placeholder="TP. Hồ Chí Minh"
            />

            <button type="submit" className="primary-button">
              {isEditing ? 'Lưu thay đổi' : 'Tạo khu sân'}
            </button>
          </form>
        </article>

        <article className="workspace-card">
          <div className="card-head">
            <div>
              <span className="mini-kicker">Portfolio</span>
              <h2>Danh sách khu sân</h2>
            </div>
          </div>

          <div className="stadium-list">
            {stadiums.length > 0 ? (
              stadiums.map((stadium) => (
                <div key={stadium.id} className="stadium-item">
                  <div className="stadium-copy">
                    <div className="stadium-title-row">
                      <h3>{stadium.name}</h3>
                      <span className={`status-badge ${stadium.status || 'active'}`}>
                        {stadium.status || 'active'}
                      </span>
                    </div>
                    <p>{stadium.description || 'Chưa có mô tả cho khu sân này.'}</p>
                    <span>
                      {formatLocationParts(
                        stadium.location?.address || stadium.address,
                        stadium.location?.district,
                        stadium.location?.city
                      ) || 'Chưa có địa chỉ'}
                    </span>
                  </div>

                  <div className="stadium-actions">
                    <button type="button" onClick={() => handleEdit(stadium)}>
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStadium(stadium);
                        setIsHashtagModalOpen(true);
                      }}
                    >
                      Hashtag
                    </button>
                    <button type="button" className="danger" onClick={() => handleDelete(stadium.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Chưa có dữ liệu khu sân để hiển thị.</div>
            )}
          </div>
        </article>
      </section>

      <StadiumHashtagModal
        stadium={selectedStadium}
        isOpen={isHashtagModalOpen}
        onClose={() => setIsHashtagModalOpen(false)}
        onSave={fetchStadiums}
      />

      <style>{`
        .stadium-workspace {
          --ink: #17324d;
          --muted: #617286;
          --gold: #d28a32;
          --mint: #1e8b77;
          --paper: rgba(255, 255, 255, 0.9);
          --line: rgba(23, 50, 77, 0.1);
          padding: 28px;
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(243, 190, 106, 0.24), transparent 28%),
            linear-gradient(180deg, #f7f1e8 0%, #f7fafc 45%, #eef6fb 100%);
          color: var(--ink);
          font-family: 'Poppins', 'Segoe UI', sans-serif;
        }

        .workspace-hero,
        .workspace-card {
          border: 1px solid var(--line);
          box-shadow: 0 20px 48px rgba(20, 43, 70, 0.09);
        }

        .workspace-hero {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
          padding: 28px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
        }

        .workspace-tag,
        .mini-kicker {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(210, 138, 50, 0.14);
          color: #ad6515;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .workspace-hero h1 {
          margin: 16px 0 10px;
          font-size: clamp(1.9rem, 3vw, 3rem);
          line-height: 1.1;
          font-weight: 800;
        }

        .workspace-hero p {
          margin: 0;
          color: var(--muted);
          line-height: 1.75;
          max-width: 680px;
        }

        .workspace-summary {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .workspace-summary div {
          padding: 18px;
          border-radius: 22px;
          background: linear-gradient(135deg, #17324d, #244f74);
          color: #fff;
        }

        .workspace-summary small {
          color: rgba(240, 245, 252, 0.72);
        }

        .workspace-summary strong {
          display: block;
          margin-top: 6px;
          font-size: 2rem;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 420px minmax(0, 1fr);
          gap: 20px;
        }

        .workspace-card {
          padding: 24px;
          border-radius: 28px;
          background: var(--paper);
        }

        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 22px;
        }

        .card-head h2 {
          margin: 10px 0 0;
          font-size: 1.45rem;
          font-weight: 800;
        }

        .ghost-button,
        .primary-button,
        .stadium-actions button {
          border: none;
          border-radius: 16px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .ghost-button {
          padding: 11px 14px;
          background: rgba(23, 50, 77, 0.08);
          color: var(--ink);
        }

        .primary-button {
          padding: 14px 18px;
          background: linear-gradient(135deg, #17324d, #2f6895);
          color: #fff;
          box-shadow: 0 16px 30px rgba(23, 50, 77, 0.18);
        }

        .workspace-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .workspace-form label {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .workspace-form input,
        .workspace-form textarea {
          width: 100%;
          border: 1px solid rgba(23, 50, 77, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.95);
          padding: 14px 16px;
          outline: none;
        }

        .workspace-form textarea {
          resize: vertical;
          min-height: 120px;
        }

        .stadium-list {
          display: grid;
          gap: 16px;
        }

        .stadium-item {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 18px;
          border-radius: 24px;
          background: rgba(249, 251, 255, 0.95);
          border: 1px solid rgba(23, 50, 77, 0.08);
        }

        .stadium-copy h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
        }

        .stadium-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .stadium-copy p,
        .stadium-copy span {
          margin: 0;
          color: var(--muted);
          line-height: 1.65;
        }

        .stadium-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 120px;
        }

        .stadium-actions button {
          padding: 10px 14px;
          background: rgba(23, 50, 77, 0.08);
          color: var(--ink);
        }

        .stadium-actions .danger {
          background: rgba(183, 52, 52, 0.1);
          color: #a12626;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .status-badge.active {
          background: rgba(30, 139, 119, 0.12);
          color: var(--mint);
        }

        .status-badge.pending {
          background: rgba(210, 138, 50, 0.14);
          color: #ad6515;
        }

        .status-badge.rejected {
          background: rgba(183, 52, 52, 0.12);
          color: #a12626;
        }

        .empty-state {
          padding: 28px;
          border-radius: 22px;
          text-align: center;
          color: var(--muted);
          background: rgba(255, 255, 255, 0.75);
          border: 1px dashed rgba(23, 50, 77, 0.15);
        }

        @media (max-width: 1100px) {
          .workspace-hero,
          .workspace-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .stadium-workspace {
            padding: 16px;
          }

          .workspace-hero,
          .workspace-card,
          .stadium-item {
            padding: 20px;
            border-radius: 22px;
          }

          .stadium-item {
            flex-direction: column;
          }

          .stadium-actions {
            flex-direction: row;
            min-width: 0;
            flex-wrap: wrap;
          }

          .stadium-actions button,
          .ghost-button,
          .primary-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageStadiums;

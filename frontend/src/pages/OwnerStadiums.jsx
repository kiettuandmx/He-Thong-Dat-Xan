import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FIELD_TYPES,
  FIELD_TYPE_OPTIONS,
  normalizeFieldType,
} from '../constants/fieldTypes';

const getAuthToken = () => {
  const authData = JSON.parse(localStorage.getItem('user') || '{}');
  return authData?.token || null;
};

const getCurrentUserId = () =>
  JSON.parse(localStorage.getItem('user') || '{}')?.user?.id;

const fieldStatusLabel = {
  active: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
};

const OwnerStadiums = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFieldId, setCurrentFieldId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    stadium_id: '',
    type: FIELD_TYPES.FOOTBALL,
    price_per_hour: '',
    image: null,
  });

  useEffect(() => {
    fetchFields();
    fetchStadiums();
  }, []);

  const fetchFields = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get('http://localhost:5000/api/owner/fields', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFields(res.data || []);
    } catch (err) {
      console.error('Loi lay danh sach san:', err);
      setFields([]);
    }
  };

  const fetchStadiums = async () => {
    try {
      const token = getAuthToken();
      const ownerId = getCurrentUserId();
      const res = await axios.get(`http://localhost:5000/api/stadiums/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStadiums(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error('Loi lay danh sach khu san:', err);
      setStadiums([]);
    }
  };

  const groupedFields = useMemo(
    () =>
      stadiums.map((stadium) => ({
        ...stadium,
        childFields: fields.filter((field) => Number(field.stadium_id) === Number(stadium.id)),
      })),
    [fields, stadiums]
  );

  const totalFields = fields.length;
  const pendingFields = fields.filter((field) => field.status === 'pending').length;

  const handleEdit = (field) => {
    setIsEditing(true);
    setCurrentFieldId(field.id);
    setFormData({
      name: field.name,
      stadium_id: field.stadium_id,
      type: normalizeFieldType(field.type),
      price_per_hour: field.price_per_hour,
      image: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentFieldId(null);
    setFormData({
      name: '',
      stadium_id: '',
      type: FIELD_TYPES.FOOTBALL,
      price_per_hour: '',
      image: null,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = getAuthToken();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('stadium_id', formData.stadium_id);
    data.append('type', formData.type);
    data.append('price_per_hour', formData.price_per_hour);
    if (formData.image) data.append('image', formData.image);

    try {
      if (isEditing && currentFieldId) {
        await axios.put(`http://localhost:5000/api/fields/${currentFieldId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Cập nhật sân thành công!');
      } else {
        await axios.post('http://localhost:5000/api/fields', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Thêm sân mới thành công!');
      }

      resetForm();
      fetchFields();
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi lưu dữ liệu!');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn muốn xóa sân này?')) return;

    try {
      const token = getAuthToken();
      await axios.delete(`http://localhost:5000/api/fields/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFields();
    } catch (error) {
      alert(error.response?.data?.error || 'Không thể xóa sân!');
    }
  };

  return (
    <div className="fields-studio">
      <section className="fields-hero">
        <div>
          <span className="fields-tag">Field Studio</span>
          <h1>Quản lý sân lẻ theo từng khu theo một bố cục rõ ràng và hiện đại.</h1>
          <p>
            Chủ sân có thể tạo sân mới, cập nhật giá, thay ảnh và theo dõi trạng thái
            duyệt ngay tại một màn hình.
          </p>
        </div>

        <div className="fields-hero-summary">
          <div>
            <small>Khu sân</small>
            <strong>{stadiums.length}</strong>
          </div>
          <div>
            <small>Tổng sân lẻ</small>
            <strong>{totalFields}</strong>
          </div>
          <div>
            <small>Chờ duyệt</small>
            <strong>{pendingFields}</strong>
          </div>
        </div>
      </section>

      <section className="fields-layout">
        <article className="fields-card field-form-card">
          <div className="fields-card-head">
            <div>
              <span className="fields-kicker">{isEditing ? 'Edit field' : 'New field'}</span>
              <h2>{isEditing ? 'Cập nhật sân lẻ' : 'Đăng ký sân lẻ mới'}</h2>
            </div>
            {isEditing && (
              <button type="button" className="field-ghost-button" onClick={resetForm}>
                Hủy
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="field-form">
            <label>Thuộc khu sân</label>
            <select
              value={formData.stadium_id}
              onChange={(event) =>
                setFormData({ ...formData, stadium_id: event.target.value })
              }
              required
            >
              <option value="">-- Chọn khu sân --</option>
              {stadiums.map((stadium) => (
                <option key={stadium.id} value={stadium.id}>
                  {stadium.name}
                </option>
              ))}
            </select>

            <label>Tên sân</label>
            <input
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
            />

            <label>Loại sân</label>
            <select
              value={formData.type}
              onChange={(event) => setFormData({ ...formData, type: event.target.value })}
            >
              {FIELD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label>Giá theo giờ (VND)</label>
            <input
              type="number"
              value={formData.price_per_hour}
              onChange={(event) =>
                setFormData({ ...formData, price_per_hour: event.target.value })
              }
              required
            />

            <label>Ảnh đại diện</label>
            <input
              type="file"
              onChange={(event) =>
                setFormData({ ...formData, image: event.target.files?.[0] || null })
              }
            />

            <button type="submit" className="field-primary-button">
              {isEditing ? 'Lưu thay đổi' : 'Thêm sân vào khu'}
            </button>
          </form>
        </article>

        <div className="field-groups">
          {groupedFields.length > 0 ? (
            groupedFields.map((stadium) => (
              <article key={stadium.id} className="fields-card group-card">
                <div className="group-head">
                  <div>
                    <span className="fields-kicker">Stadium</span>
                    <h2>{stadium.name}</h2>
                  </div>
                  <span className="group-count">{stadium.childFields.length} sân</span>
                </div>

                <div className="field-grid">
                  {stadium.childFields.length > 0 ? (
                    stadium.childFields.map((field) => (
                      <div key={field.id} className="field-item-card">
                        <img
                          src={
                            field.images?.[0]?.image_url
                              ? field.images[0].image_url.startsWith('http')
                                ? field.images[0].image_url
                                : `http://localhost:5000/uploads/${field.images[0].image_url}`
                              : 'https://via.placeholder.com/120x120?text=Field'
                          }
                          alt={field.name}
                        />

                        <div className="field-item-copy">
                          <div className="field-title-row">
                            <h3>{field.name}</h3>
                            <span className={`field-status ${field.status || 'pending'}`}>
                              {fieldStatusLabel[field.status] || field.status || 'Chờ duyệt'}
                            </span>
                          </div>

                          <p>
                            {field.type} · {Number(field.price_per_hour || 0).toLocaleString()} VND/h
                          </p>

                          <div className="field-item-actions">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/owner/edit-field/${field.id}`)
                              }
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => handleDelete(field.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="field-empty-state">Khu này chưa có sân lẻ nào.</div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <article className="fields-card field-empty-state">
              Chưa có khu sân nào để hiển thị danh sách sân lẻ.
            </article>
          )}
        </div>
      </section>

      <style>{`
        .fields-studio {
          --ink: #172f4a;
          --muted: #66778d;
          --paper: rgba(255, 255, 255, 0.9);
          --line: rgba(23, 47, 74, 0.1);
          --teal: #10796a;
          --amber: #c87f28;
          padding: 28px;
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(44, 128, 120, 0.16), transparent 28%),
            radial-gradient(circle at top left, rgba(235, 179, 94, 0.2), transparent 24%),
            linear-gradient(180deg, #f4efe5 0%, #f8fbff 48%, #eef6f9 100%);
          color: var(--ink);
          font-family: 'Poppins', 'Segoe UI', sans-serif;
        }

        .fields-hero,
        .fields-card {
          border: 1px solid var(--line);
          box-shadow: 0 20px 48px rgba(22, 48, 73, 0.09);
        }

        .fields-hero {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
          padding: 28px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
        }

        .fields-tag,
        .fields-kicker {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(16, 121, 106, 0.12);
          color: var(--teal);
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .fields-hero h1 {
          margin: 16px 0 10px;
          font-size: clamp(1.9rem, 3vw, 3rem);
          line-height: 1.08;
          font-weight: 800;
        }

        .fields-hero p {
          margin: 0;
          max-width: 680px;
          color: var(--muted);
          line-height: 1.75;
        }

        .fields-hero-summary {
          display: grid;
          gap: 12px;
        }

        .fields-hero-summary div {
          padding: 18px;
          border-radius: 22px;
          background: linear-gradient(135deg, #17324d, #24556f);
          color: #fff;
        }

        .fields-hero-summary small {
          color: rgba(240, 245, 252, 0.72);
        }

        .fields-hero-summary strong {
          display: block;
          margin-top: 6px;
          font-size: 2rem;
        }

        .fields-layout {
          display: grid;
          grid-template-columns: 400px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .fields-card {
          padding: 24px;
          border-radius: 28px;
          background: var(--paper);
        }

        .fields-card-head,
        .group-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .fields-card-head h2,
        .group-head h2 {
          margin: 10px 0 0;
          font-size: 1.45rem;
          font-weight: 800;
        }

        .field-ghost-button,
        .field-primary-button,
        .field-item-actions button {
          border: none;
          border-radius: 16px;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .field-ghost-button {
          padding: 11px 14px;
          background: rgba(23, 47, 74, 0.08);
          color: var(--ink);
        }

        .field-primary-button {
          padding: 14px 18px;
          background: linear-gradient(135deg, #17324d, #2f7c73);
          color: #fff;
          box-shadow: 0 16px 30px rgba(23, 50, 77, 0.18);
        }

        .field-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .field-form label {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .field-form input,
        .field-form select {
          width: 100%;
          border: 1px solid rgba(23, 47, 74, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.95);
          padding: 14px 16px;
          outline: none;
        }

        .field-groups {
          display: grid;
          gap: 18px;
        }

        .group-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 16px;
          background: rgba(23, 47, 74, 0.08);
          color: var(--ink);
          font-weight: 700;
        }

        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field-item-card {
          display: flex;
          gap: 14px;
          padding: 14px;
          border-radius: 22px;
          background: rgba(249, 251, 255, 0.96);
          border: 1px solid rgba(23, 47, 74, 0.08);
        }

        .field-item-card img {
          width: 110px;
          height: 110px;
          object-fit: cover;
          border-radius: 18px;
          flex-shrink: 0;
        }

        .field-item-copy {
          min-width: 0;
          flex: 1;
        }

        .field-title-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .field-item-copy h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
        }

        .field-item-copy p {
          margin: 0 0 14px;
          color: var(--muted);
          line-height: 1.65;
        }

        .field-item-actions {
          display: flex;
          gap: 10px;
        }

        .field-item-actions button {
          padding: 10px 14px;
          background: rgba(23, 47, 74, 0.08);
          color: var(--ink);
        }

        .field-item-actions .danger {
          background: rgba(181, 53, 53, 0.1);
          color: #9f2424;
        }

        .field-status {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .field-status.active {
          background: rgba(16, 121, 106, 0.12);
          color: var(--teal);
        }

        .field-status.pending {
          background: rgba(200, 127, 40, 0.14);
          color: var(--amber);
        }

        .field-status.rejected {
          background: rgba(181, 53, 53, 0.12);
          color: #9f2424;
        }

        .field-empty-state {
          padding: 26px;
          text-align: center;
          color: var(--muted);
          border: 1px dashed rgba(23, 47, 74, 0.16);
          background: rgba(255, 255, 255, 0.75);
        }

        @media (max-width: 1180px) {
          .fields-hero,
          .fields-layout,
          .field-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .fields-studio {
            padding: 16px;
          }

          .fields-hero,
          .fields-card,
          .field-item-card {
            padding: 20px;
            border-radius: 22px;
          }

          .field-item-card,
          .field-item-actions {
            flex-direction: column;
          }

          .field-item-card img,
          .field-item-actions button,
          .field-ghost-button,
          .field-primary-button {
            width: 100%;
          }

          .field-item-card img {
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
};

export default OwnerStadiums;

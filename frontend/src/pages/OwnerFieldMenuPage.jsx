import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  createStadiumMenuItem,
  deleteMenuItem,
  getStadiumMenu,
  updateMenuItem,
  updateMenuItemAvailability,
} from '../services/menuService';

const OwnerFieldMenuPage = () => {
  const { stadiumId, fieldId } = useParams();
  const [resolvedStadiumId, setResolvedStadiumId] = useState(stadiumId || '');
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    name: '',
    price: '',
    image: '',
  });

  const loadRows = async () => {
    if (!resolvedStadiumId) return;
    const response = await getStadiumMenu(resolvedStadiumId);
    setRows(response.data?.data || []);
  };

  useEffect(() => {
    if (stadiumId) {
      setResolvedStadiumId(stadiumId);
      return;
    }

    if (!fieldId) return;

    let ignore = false;
    const resolveStadium = async () => {
      const response = await axios.get(`http://localhost:5000/api/fields/${fieldId}`);
      if (!ignore) {
        setResolvedStadiumId(String(response.data?.stadium_id || ''));
      }
    };

    resolveStadium();

    return () => {
      ignore = true;
    };
  }, [fieldId, stadiumId]);

  useEffect(() => {
    loadRows();
  }, [resolvedStadiumId]);

  const handleCreate = async () => {
    await createStadiumMenuItem(resolvedStadiumId, {
      name,
      price,
      image,
      is_available: true,
    });
    setName('');
    setPrice('');
    setImage('');
    await loadRows();
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditingData({
      name: row.name || '',
      price: row.price || '',
      image: row.image || '',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateMenuItem(editingId, {
      name: editingData.name,
      price: editingData.price,
      image: editingData.image,
    });
    setEditingId(null);
    setEditingData({ name: '', price: '', image: '' });
    await loadRows();
  };

  const removeItem = async (menuItemId) => {
    await deleteMenuItem(menuItemId);
    if (editingId === menuItemId) {
      setEditingId(null);
      setEditingData({ name: '', price: '', image: '' });
    }
    await loadRows();
  };

  const toggleAvailability = async (row) => {
    await updateMenuItemAvailability(row.id, !row.is_available);
    await loadRows();
  };

  return (
    <div className="detail-page recurring-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow mb-2">Menu theo khu sân</p>
          <h1 className="display-title mb-3">Menu chung của khu sân</h1>
          <p className="detail-subtitle mb-0">
            Tất cả sân con trong khu này sẽ dùng chung một menu. Khách chỉ thấy các món đang bán.
          </p>
        </div>
      </section>

      <section className="detail-panel">
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <input
              className="filter-input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Tên món"
              value={name}
            />
          </div>
          <div className="col-md-3">
            <input
              className="filter-input"
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Giá"
              type="number"
              value={price}
            />
          </div>
          <div className="col-md-3">
            <input
              className="filter-input"
              onChange={(event) => setImage(event.target.value)}
              placeholder="Link ảnh món"
              value={image}
            />
          </div>
          <div className="col-md-2">
            <button className="primary-button w-100" onClick={handleCreate} type="button">
              Thêm món
            </button>
          </div>
        </div>

        <div className="row g-3">
          {rows.map((row) => (
            <div key={row.id} className="col-md-6">
              <div className="menu-item-card">
                {editingId === row.id ? (
                  <div className="d-flex flex-column gap-2">
                    <input
                      className="filter-input"
                      onChange={(event) =>
                        setEditingData((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Tên món"
                      value={editingData.name}
                    />
                    <input
                      className="filter-input"
                      onChange={(event) =>
                        setEditingData((current) => ({ ...current, price: event.target.value }))
                      }
                      placeholder="Giá"
                      type="number"
                      value={editingData.price}
                    />
                    <input
                      className="filter-input"
                      onChange={(event) =>
                        setEditingData((current) => ({ ...current, image: event.target.value }))
                      }
                      placeholder="Link ảnh món"
                      value={editingData.image}
                    />
                    <div className="d-flex gap-2">
                      <button className="primary-button" onClick={saveEdit} type="button">
                        Lưu
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingData({ name: '', price: '', image: '' });
                        }}
                        type="button"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <strong>{row.name}</strong>
                        <div className="small text-muted">
                          {Number(row.price || 0).toLocaleString('vi-VN')}đ
                        </div>
                        <div className={`small mt-1 ${row.is_available ? 'text-success' : 'text-danger'}`}>
                          {row.is_available ? 'Đang bán' : 'Hết món'}
                        </div>
                      </div>
                      {row.image && (
                        <img
                          alt={row.name}
                          src={row.image}
                          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px' }}
                        />
                      )}
                    </div>
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      <button className="secondary-button" onClick={() => startEdit(row)} type="button">
                        Sửa
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => toggleAvailability(row)}
                        type="button"
                      >
                        {row.is_available ? 'Đánh dấu hết món' : 'Bật bán lại'}
                      </button>
                      <button className="secondary-button" onClick={() => removeItem(row.id)} type="button">
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OwnerFieldMenuPage;

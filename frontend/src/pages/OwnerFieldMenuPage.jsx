import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createFieldMenuItem, getFieldMenu } from '../services/menuService';

const OwnerFieldMenuPage = () => {
  const { fieldId } = useParams();
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const loadRows = async () => {
    const response = await getFieldMenu(fieldId);
    setRows(response.data?.data || []);
  };

  useEffect(() => {
    loadRows();
  }, [fieldId]);

  const handleCreate = async () => {
    await createFieldMenuItem(fieldId, {
      name,
      price,
      is_available: true,
    });
    setName('');
    setPrice('');
    await loadRows();
  };

  return (
    <div className="detail-page recurring-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow mb-2">Owner menu</p>
          <h1 className="display-title mb-3">Menu sân</h1>
        </div>
      </section>

      <section className="detail-panel">
        <div className="row g-3 mb-4">
          <div className="col-md-5">
            <input
              className="filter-input"
              onChange={(event) => setName(event.target.value)}
              placeholder="Tên món"
              value={name}
            />
          </div>
          <div className="col-md-4">
            <input
              className="filter-input"
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Giá"
              type="number"
              value={price}
            />
          </div>
          <div className="col-md-3">
            <button className="primary-button w-100" onClick={handleCreate} type="button">
              Thêm món
            </button>
          </div>
        </div>

        <div className="row g-3">
          {rows.map((row) => (
            <div key={row.id} className="col-md-6">
              <div className="menu-item-card">
                <strong>{row.name}</strong>
                <div className="small text-muted">{Number(row.price || 0).toLocaleString('vi-VN')}đ</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OwnerFieldMenuPage;

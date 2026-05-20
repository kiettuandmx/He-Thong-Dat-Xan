import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { updateFoodOrderStatus } from '../services/foodOrderService';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

const OwnerFoodOrdersPage = () => {
  const { fieldId } = useParams();
  const [rows, setRows] = useState([]);

  const loadRows = async () => {
    const response = await axios.get(`http://localhost:5000/api/bookings/owner/${fieldId}`, {
      headers: getAuthHeaders(),
    });
    const bookings = Array.isArray(response.data) ? response.data : [];
    const flattened = bookings.flatMap((booking) => booking.foodOrders || []);
    setRows(flattened);
  };

  useEffect(() => {
    loadRows();
  }, [fieldId]);

  const advance = async (orderId, status) => {
    await updateFoodOrderStatus(orderId, status);
    await loadRows();
  };

  return (
    <div className="detail-page recurring-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow mb-2">Owner food orders</p>
          <h1 className="display-title mb-3">Đơn món theo sân</h1>
        </div>
      </section>

      <section className="detail-panel">
        <div className="row g-3">
          {rows.map((row) => (
            <div key={row.id} className="col-12">
              <div className="recurring-owner-card">
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <strong>Order #{row.id}</strong>
                    <div className="small text-muted">Trạng thái: {row.status}</div>
                  </div>
                  <div className="d-flex gap-2">
                    {row.status === 'pending' && (
                      <button
                        className="secondary-button"
                        onClick={() => advance(row.id, 'preparing')}
                        type="button"
                      >
                        Đang chuẩn bị
                      </button>
                    )}
                    {row.status === 'preparing' && (
                      <button
                        className="primary-button"
                        onClick={() => advance(row.id, 'delivered')}
                        type="button"
                      >
                        Đã giao
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OwnerFoodOrdersPage;

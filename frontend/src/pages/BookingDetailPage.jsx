import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import FoodOrderPicker from '../components/FoodOrderPicker';
import { getFieldMenu } from '../services/menuService';
import { createFoodOrder, getFoodOrdersForBooking } from '../services/foodOrderService';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

const BookingDetailPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [selections, setSelections] = useState({});

  const loadAll = async () => {
    const bookingResponse = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    const bookingData = bookingResponse.data?.data;
    setBooking(bookingData);

    const [menuResponse, orderResponse] = await Promise.all([
      getFieldMenu(bookingData.field_id),
      getFoodOrdersForBooking(bookingId),
    ]);

    setMenuItems(menuResponse.data?.data || []);
    setFoodOrders(orderResponse.data?.data || []);
  };

  useEffect(() => {
    loadAll();
  }, [bookingId]);

  const updateQuantity = (itemId, delta) => {
    setSelections((current) => ({
      ...current,
      [itemId]: Math.max((current[itemId] || 0) + delta, 0),
    }));
  };

  const handleCreateOrder = async () => {
    const items = Object.entries(selections)
      .filter(([, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({
        menu_item_id: Number(menuItemId),
        quantity,
      }));

    if (items.length === 0) return;

    await createFoodOrder(bookingId, {
      items,
      payment_method: 'wallet',
    });
    setSelections({});
    await loadAll();
  };

  if (!booking) {
    return <div className="detail-page"><div className="listing-state-card">Đang tải chi tiết booking...</div></div>;
  }

  return (
    <div className="detail-page recurring-page">
      <section className="detail-hero">
        <div>
          <p className="eyebrow mb-2">Booking detail</p>
          <h1 className="display-title mb-3">Chi tiết booking</h1>
          <p className="detail-subtitle mb-0">{booking.field?.name}</p>
        </div>
      </section>

      <section className="detail-panel">
        <FoodOrderPicker
          items={menuItems}
          onDecrease={(itemId) => updateQuantity(itemId, -1)}
          onIncrease={(itemId) => updateQuantity(itemId, 1)}
          selections={selections}
        />
        <button className="primary-button mt-4" onClick={handleCreateOrder} type="button">
          Gọi thêm món
        </button>
      </section>

      <section className="detail-panel">
        <h2 className="h5 fw-bold mb-3">Lịch sử order món</h2>
        <div className="row g-3">
          {foodOrders.map((order) => (
            <div key={order.id} className="col-12">
              <div className="recurring-series-card">
                <strong>Order #{order.id}</strong>
                <div className="small text-muted">Trạng thái: {order.status}</div>
                <div className="small text-muted">Thanh toán: {order.payment_status}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BookingDetailPage;

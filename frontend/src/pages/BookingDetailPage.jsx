import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import FoodOrderPicker from '../components/FoodOrderPicker';
import { getStadiumMenu } from '../services/menuService';
import { createFoodOrder, getFoodOrdersForBooking } from '../services/foodOrderService';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

const BookingDetailPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [selections, setSelections] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  const loadAll = async () => {
    const bookingResponse = await axios.get(`http://localhost:5000/api/bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    const bookingData = bookingResponse.data?.data;
    setBooking(bookingData);

    const [menuResponse, orderResponse] = await Promise.all([
      getStadiumMenu(bookingData.stadium_id || bookingData.field?.stadium_id),
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

  const isFoodOrderingAvailable = useMemo(() => {
    if (!booking?.booking_date || !booking?.end_time) {
      return false;
    }

    const now = new Date();
    const end = new Date(`${booking.booking_date}T${booking.end_time}`);
    return now <= end;
  }, [booking]);

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
      payment_method: paymentMethod,
    });
    setSelections({});
    const response = await getFoodOrdersForBooking(bookingId);
    const rows = response.data?.data || [];
    setFoodOrders(rows);
    const latestOrder = rows[0];

    if (paymentMethod === 'bank_transfer' && latestOrder?.payment_reference) {
      navigate(`/food-order-payment/${latestOrder.id}`);
      return;
    }

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

      {isFoodOrderingAvailable ? (
        <section className="detail-panel">
          <div className="mb-3 text-muted small">
            Bạn có thể đặt thêm món trước và trong giờ chơi. Sau khi hết giờ, hệ thống sẽ tự khóa tính năng này.
          </div>
          <FoodOrderPicker
            items={menuItems}
            onDecrease={(itemId) => updateQuantity(itemId, -1)}
            onIncrease={(itemId) => updateQuantity(itemId, 1)}
            selections={selections}
          />
          <div className="d-flex gap-2 mt-3 flex-wrap">
            <button
              className={`secondary-button ${paymentMethod === 'wallet' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('wallet')}
              type="button"
            >
              Thanh toán ví
            </button>
            <button
              className={`secondary-button ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('bank_transfer')}
              type="button"
            >
              Chuyển khoản
            </button>
          </div>
          <button className="primary-button mt-4" onClick={handleCreateOrder} type="button">
            Gọi thêm món
          </button>
        </section>
      ) : (
        <section className="detail-panel">
          <div className="listing-state-card">
            Khung giờ của booking này đã kết thúc nên bạn không thể đặt thêm đồ ăn hoặc nước uống nữa.
          </div>
        </section>
      )}

      <section className="detail-panel">
        <h2 className="h5 fw-bold mb-3">Lịch sử order món</h2>
        <div className="row g-3">
          {foodOrders.map((order) => (
            <div key={order.id} className="col-12">
              <div className="recurring-series-card">
                <strong>Order #{order.id}</strong>
                <div className="small text-muted">Trạng thái: {order.status}</div>
                <div className="small text-muted">Thanh toán: {order.payment_status}</div>
                {order.payment_reference && (
                  <div className="small text-muted">Mã thanh toán: {order.payment_reference}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BookingDetailPage;

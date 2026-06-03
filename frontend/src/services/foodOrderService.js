import axios from 'axios';

const API_URL = 'http://localhost:5000/api/food-orders';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

export const createFoodOrder = (bookingId, payload) =>
  axios.post(`${API_URL}/bookings/${bookingId}/orders`, payload, { headers: getAuthHeaders() });

export const getFoodOrdersForBooking = (bookingId) =>
  axios.get(`${API_URL}/bookings/${bookingId}/orders`, { headers: getAuthHeaders() });

export const getFoodOrderById = (foodOrderId) =>
  axios.get(`${API_URL}/orders/${foodOrderId}`, { headers: getAuthHeaders() });

export const updateFoodOrderStatus = (foodOrderId, status) =>
  axios.put(
    `${API_URL}/orders/${foodOrderId}/status`,
    { status },
    { headers: getAuthHeaders() }
  );

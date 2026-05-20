import axios from 'axios';

const API_URL = 'http://localhost:5000/api/recurring-bookings';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

export const previewRecurringBooking = (payload) =>
  axios.post(`${API_URL}/preview`, payload, { headers: getAuthHeaders() });

export const createRecurringBooking = (payload) =>
  axios.post(API_URL, payload, { headers: getAuthHeaders() });

export const getMyRecurringBookings = () =>
  axios.get(`${API_URL}/mine`, { headers: getAuthHeaders() });

export const getOwnerRecurringBookings = (status = 'pending_owner_review') =>
  axios.get(`${API_URL}/owner/pending`, {
    headers: getAuthHeaders(),
    params: { status },
  });

export const approveRecurringBooking = (id) =>
  axios.put(`${API_URL}/owner/${id}/approve`, {}, { headers: getAuthHeaders() });

export const rejectRecurringBooking = (id) =>
  axios.put(`${API_URL}/owner/${id}/reject`, {}, { headers: getAuthHeaders() });

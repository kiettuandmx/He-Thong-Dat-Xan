import axios from 'axios';

const API_URL = 'http://localhost:5000/api/menu';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

export const getStadiumMenu = (stadiumId) => axios.get(`${API_URL}/stadiums/${stadiumId}/menu`);

export const createStadiumMenuItem = (stadiumId, payload) =>
  axios.post(`${API_URL}/stadiums/${stadiumId}/menu`, payload, { headers: getAuthHeaders() });

export const updateMenuItem = (menuItemId, payload) =>
  axios.put(`${API_URL}/items/${menuItemId}`, payload, { headers: getAuthHeaders() });

export const updateMenuItemAvailability = (menuItemId, isAvailable) =>
  axios.patch(
    `${API_URL}/items/${menuItemId}/availability`,
    { is_available: isAvailable },
    { headers: getAuthHeaders() }
  );

export const deleteMenuItem = (menuItemId) =>
  axios.delete(`${API_URL}/items/${menuItemId}`, { headers: getAuthHeaders() });

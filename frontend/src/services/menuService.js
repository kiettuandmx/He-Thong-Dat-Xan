import axios from 'axios';

const API_URL = 'http://localhost:5000/api/menu';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

export const getFieldMenu = (fieldId) => axios.get(`${API_URL}/fields/${fieldId}/menu`);

export const createFieldMenuItem = (fieldId, payload) =>
  axios.post(`${API_URL}/fields/${fieldId}/menu`, payload, { headers: getAuthHeaders() });

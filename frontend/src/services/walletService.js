import axios from 'axios';

const API_URL = 'http://localhost:5000/api/wallet';

const getAuthHeaders = () => {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  return stored?.token ? { Authorization: `Bearer ${stored.token}` } : {};
};

export const getWalletSummary = () =>
  axios.get(`${API_URL}/summary`, { headers: getAuthHeaders() });

export const getWalletTransactions = () =>
  axios.get(`${API_URL}/transactions`, { headers: getAuthHeaders() });

export const topUpWallet = (payload) =>
  axios.post(`${API_URL}/top-up`, payload, { headers: getAuthHeaders() });

export const withdrawWallet = (payload) =>
  axios.post(`${API_URL}/withdraw`, payload, { headers: getAuthHeaders() });

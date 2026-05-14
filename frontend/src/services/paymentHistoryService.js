import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/bookings';

function getAuthConfig() {
  const token = JSON.parse(localStorage.getItem('user') || 'null')?.token;

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function buildCurrentMonthDefaultFilter() {
  const now = new Date();

  return {
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear()),
    page: 1,
    limit: 10,
  };
}

export async function getUserPaymentHistory(params) {
  const response = await axios.get(`${API_BASE_URL}/payment-history`, {
    ...getAuthConfig(),
    params,
  });

  return response.data;
}

export async function getOwnerPaymentHistory(params) {
  const response = await axios.get(`${API_BASE_URL}/owner/payment-history`, {
    ...getAuthConfig(),
    params,
  });

  return response.data;
}

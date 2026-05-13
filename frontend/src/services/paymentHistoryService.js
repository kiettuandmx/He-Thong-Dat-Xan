import axios from "axios";

const API_URL = "http://localhost:5000/api";

function getAuthHeaders() {
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const token = parsedUser?.token;

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function buildHistoryParams(filters = {}) {
  return {
    month: filters.month,
    year: filters.year,
    startDate: filters.startDate,
    endDate: filters.endDate,
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
  };
}

export function buildCurrentMonthDefaultFilter() {
  const now = new Date();

  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear()),
    page: 1,
    limit: 10,
  };
}

export async function getUserPaymentHistory(filters = {}) {
  const response = await axios.get(`${API_URL}/bookings/payment-history`, {
    headers: getAuthHeaders(),
    params: buildHistoryParams(filters),
  });

  return response.data;
}

export async function getOwnerPaymentHistory(filters = {}) {
  const response = await axios.get(
    `${API_URL}/bookings/owner/payment-history`,
    {
      headers: getAuthHeaders(),
      params: buildHistoryParams(filters),
    },
  );

  return response.data;
}

export default {
  buildCurrentMonthDefaultFilter,
  getOwnerPaymentHistory,
  getUserPaymentHistory,
};

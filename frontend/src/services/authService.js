import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Hàm đăng nhập
export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

// Hàm đăng ký
export const register = async (userData) => {
  // userData ở đây chính là object {name, email, password, phone, role_id}
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};
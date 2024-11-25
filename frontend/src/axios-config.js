import axios from 'axios';

// Create a custom axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: 'https://hower-app-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// Simple error logging
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
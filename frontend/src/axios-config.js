import axios from 'axios';

// Create a custom axios instance with base configuration
const axiosInstance = axios.create({
  // In development, this will be proxied by Vite
  // In production, this will be relative to the current domain
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Simple error logging
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      headers: error.response?.headers
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
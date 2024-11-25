import axios from 'axios';

// Set base URL for all axios requests
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
axios.defaults.baseURL = BASE_URL;

// Add request interceptor for error handling
axios.interceptors.request.use(
  config => {
    // Log the full URL being requested
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default axios;
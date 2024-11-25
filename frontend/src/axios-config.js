import axios from 'axios';

// Set base URL for all axios requests
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

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
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default axios;
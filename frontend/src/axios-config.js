import axios from 'axios';

// Create a custom axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to log and modify requests
axiosInstance.interceptors.request.use(
  config => {
    // Log all requests
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      params: config.params,
      data: config.data
    });

    // Rewrite legacy endpoints
    if (config.url === '/api/sync') {
      console.warn('Legacy endpoint /api/sync detected, rewriting to new endpoint');
      config.url = config.method === 'get' ? '/api/purchases/lists' : '/api/purchases/save-lists';
    }

    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  response => {
    console.log(`[API Response] ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('[API Response Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Override the global axios to prevent direct usage
// This will help identify where direct axios calls are being made
axios.interceptors.request.use(config => {
  console.warn(
    'Direct axios usage detected! Use axiosInstance instead.',
    new Error().stack
  );
  return config;
});

export default axiosInstance;
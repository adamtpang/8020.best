import axios from 'axios';

// Set the base URL based on the environment
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create an axios instance with default config
const api = axios.create({
    baseURL,
    timeout: 20000, // 20 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Add auth token to requests when available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle authentication errors
        if (error.response && error.response.status === 401) {
            console.error('API Auth Error:', error.response.data);

            // Clear local storage but don't force reload
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Don't force page navigation - this can cause refresh loops
            // window.location.href = '/';

            // Log the error instead
            console.warn('Authentication error: 401 Unauthorized. User token cleared.');
        }
        return Promise.reject(error);
    }
);

// Export the API instance both as default and named export
export { api };
export default api;

/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @returns {Promise} - Response from the server
 */
export const register = async (userData) => {
    const response = await api.post('/api/users/register', userData);
    return response.data;
};

/**
 * Login a user
 * @param {Object} credentials - User login credentials
 * @returns {Promise} - Response with user data and token
 */
export const login = async (credentials) => {
    const response = await api.post('/api/users/login', credentials);

    // Store token and user data in local storage
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
};

/**
 * Logout the current user
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('credits');
};

/**
 * Get current user data
 * @returns {Promise} - Response with user data
 */
export const getCurrentUser = async () => {
    const response = await api.get('/api/users/me');
    return response.data;
};

/**
 * Get available credit packages
 * @returns {Promise} - Response with available packages
 */
export const getCreditPackages = async () => {
    const response = await api.get('/api/purchases/credit-packages');
    return response.data;
};

/**
 * Create a checkout session for buying credits
 * @param {string} packageId - Credit package ID
 * @param {string} successUrl - URL to redirect to on success
 * @param {string} cancelUrl - URL to redirect to on cancel
 * @returns {Promise} - Response with checkout URL
 */
export const createCheckoutSession = async (packageId, successUrl, cancelUrl) => {
    const response = await api.post('/api/purchases/buy-credits', {
        packageId,
        successUrl,
        cancelUrl
    });
    return response.data;
};

/**
 * Check if a purchase was successful
 * @returns {Promise} - Response with success status and updated credits
 */
export const checkPurchaseSuccess = async () => {
    const response = await api.get('/api/purchases/check-success');
    return response.data;
};

/**
 * Grant credits to a user (for admins)
 * @param {Object} data - Credit grant data { email, userId, amount }
 * @returns {Promise} - Response with grant result
 */
export const grantCredits = async (data) => {
    const response = await api.post('/api/admin/grant-credits', data);
    return response.data;
};

/**
 * Get admin stats
 * @returns {Promise} - Response with admin stats
 */
export const getAdminStats = async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
};

/**
 * Get all users (admin only)
 * @returns {Promise} - Response with users list
 */
export const getUsers = async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
};

/**
 * Update user settings (admin only)
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise} - Response with updated user
 */
export const updateUser = async (userId, userData) => {
    const response = await api.put(`/api/admin/user/${userId}`, userData);
    return response.data;
};
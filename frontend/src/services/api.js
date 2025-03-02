import axios from 'axios';

// Set the base URL based on the environment
const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://8020.best'
    : 'http://localhost:3000';

// Create an axios instance with default config
const axiosInstance = axios.create({
    baseURL,
    timeout: 20000, // 20 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor for authentication
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from local storage
        const token = localStorage.getItem('token');

        // If token exists, add it to the headers
        if (token) {
            config.headers['x-auth-token'] = token;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle authentication errors
        if (error.response && error.response.status === 401) {
            // Clear local storage and redirect to login page
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;

/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @returns {Promise} - Response from the server
 */
export const register = async (userData) => {
    const response = await axiosInstance.post('/api/users/register', userData);
    return response.data;
};

/**
 * Login a user
 * @param {Object} credentials - User login credentials
 * @returns {Promise} - Response with user data and token
 */
export const login = async (credentials) => {
    const response = await axiosInstance.post('/api/users/login', credentials);

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
 * Get the current user's credit balance
 * @returns {Promise} - Response with credit balance
 */
export const getCredits = async () => {
    const response = await axiosInstance.get('/api/purchases/credits');

    // Store credits in local storage
    localStorage.setItem('credits', response.data.credits);

    return response.data;
};

/**
 * Create a payment intent for credit purchase
 * @param {string} creditPackage - Package type ('small' or 'large')
 * @returns {Promise} - Response with client secret
 */
export const createPaymentIntent = async (creditPackage) => {
    const response = await axiosInstance.post('/api/purchases/create-payment-intent', {
        creditPackage
    });

    return response.data;
};

/**
 * Confirm successful payment and add credits
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise} - Response with success status
 */
export const confirmPayment = async (paymentIntentId) => {
    const response = await axiosInstance.post('/api/purchases/payment-success', {
        paymentIntentId
    });

    return response.data;
};
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Authentication service for managing user sessions and login status
const AuthService = {
    // Register a new user
    async register(userData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    // Login a user with email and password
    async login(credentials) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Login or register with Google OAuth
    async googleAuth(tokenId) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/google`, { tokenId });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                // Make sure we store the profile picture if available
                if (response.data.user && response.data.user.profilePicture) {
                    const userData = {
                        ...response.data.user,
                        photoURL: response.data.user.profilePicture // Add photoURL for UI consistency
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                }
            }
            return response.data;
        } catch (error) {
            console.error('Google authentication error:', error);
            throw error;
        }
    },

    // Get current user data from token
    async getCurrentUser() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return null;
            }

            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update stored user data
            localStorage.setItem('user', JSON.stringify(response.data.user));

            return response.data.user;
        } catch (error) {
            console.error('Error getting current user:', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                this.logout(); // Token expired or invalid
            }
            return null;
        }
    },

    // Logout the current user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Force a page reload to clear any application state
        window.location.href = '/login';
    },

    // Get stored user data
    getUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Error parsing user data', e);
                return null;
            }
        }
        return null;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    // Get auth token
    getToken() {
        return localStorage.getItem('token');
    },

    // Add default auth headers to axios
    setupAxiosInterceptors() {
        axios.interceptors.request.use(
            config => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            error => {
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle auth errors
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    this.logout();
                }
                return Promise.reject(error);
            }
        );
    }
};

export default AuthService;

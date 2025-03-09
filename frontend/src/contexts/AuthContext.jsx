import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/auth';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};

// Auth context provider component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in on initial load
    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                // First check local storage
                const storedUser = AuthService.getUser();

                if (storedUser) {
                    setCurrentUser(storedUser);
                }

                // Then verify with backend for fresh data
                const user = await AuthService.getCurrentUser();

                if (user) {
                    setCurrentUser(user);
                } else if (storedUser) {
                    // If backend check fails but we have a stored user, clear it
                    AuthService.logout();
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };

        // Setup axios interceptors for auth headers
        AuthService.setupAxiosInterceptors();

        // Check login status
        checkLoggedIn();
    }, []);

    // Register a new user
    const register = async (userData) => {
        const response = await AuthService.register(userData);
        setCurrentUser(response.user);
        return response;
    };

    // Login with email and password
    const login = async (credentials) => {
        const response = await AuthService.login(credentials);
        setCurrentUser(response.user);
        return response;
    };

    // Login with Google
    const googleLogin = async (tokenId) => {
        const response = await AuthService.googleAuth(tokenId);

        // Ensure the user object has all necessary fields including photoURL
        const user = response.user;
        if (user && user.profilePicture && !user.photoURL) {
            user.photoURL = user.profilePicture;
        }

        setCurrentUser(user);
        return response;
    };

    // Logout the current user
    const logout = () => {
        AuthService.logout();
        setCurrentUser(null);
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!currentUser && AuthService.isAuthenticated();
    };

    // Update user data
    const updateUser = (userData) => {
        setCurrentUser(prevUser => ({
            ...prevUser,
            ...userData
        }));

        // Update local storage
        const storedUser = AuthService.getUser();
        if (storedUser) {
            localStorage.setItem('user', JSON.stringify({
                ...storedUser,
                ...userData
            }));
        }
    };

    const value = {
        currentUser,
        loading,
        register,
        login,
        googleLogin,
        logout,
        isAuthenticated,
        updateUser,
        refreshUser: AuthService.getCurrentUser, // Function to refresh user data from backend
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
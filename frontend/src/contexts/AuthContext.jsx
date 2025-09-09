import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle, signInWithGithub, signOutUser } from '../firebase-config';
import axiosInstance from '../services/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState(null);

    // Initialize authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('Firebase auth state changed:', firebaseUser?.email);
            setFirebaseUser(firebaseUser);

            if (firebaseUser) {
                try {
                    // Get the Firebase ID token
                    const idToken = await firebaseUser.getIdToken();
                    
                    // Store token in localStorage
                    localStorage.setItem('auth_token', idToken);
                    
                    // Set axios default header
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

                    // Send user data to backend for registration/login
                    const response = await axiosInstance.post('/api/users/oauth-auth', {
                        firebaseUser: {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL
                        },
                        provider: firebaseUser.providerData?.[0]?.providerId || 'firebase'
                    });

                    if (response.data.success) {
                        console.log('User authenticated successfully:', response.data.user.email);
                        setUser(response.data.user);
                        
                        // Store user data in localStorage
                        localStorage.setItem('user_data', JSON.stringify(response.data.user));
                        
                        // Update axios header with the JWT token from our backend
                        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                        localStorage.setItem('jwt_token', response.data.token);
                    }
                } catch (error) {
                    console.error('Error during OAuth authentication:', error);
                    // Clear any stale data
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('user_data');
                    delete axiosInstance.defaults.headers.common['Authorization'];
                    setUser(null);
                }
            } else {
                // User is signed out
                console.log('User signed out');
                setUser(null);
                
                // Clear stored authentication data
                localStorage.removeItem('auth_token');
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_data');
                delete axiosInstance.defaults.headers.common['Authorization'];
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // On app load, check for stored authentication
    useEffect(() => {
        const storedToken = localStorage.getItem('jwt_token');
        const storedUser = localStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                console.log('Restored authentication from localStorage');
            } catch (error) {
                console.error('Error restoring authentication:', error);
                // Clear invalid data
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_data');
            }
        }
    }, []);

    const signInWithGoogleProvider = async () => {
        try {
            setLoading(true);
            const user = await signInWithGoogle();
            console.log('Google sign-in initiated for:', user.email);
            // The onAuthStateChanged listener will handle the rest
            return user;
        } catch (error) {
            console.error('Google sign-in error:', error);
            setLoading(false);
            throw error;
        }
    };

    const signInWithGithubProvider = async () => {
        try {
            setLoading(true);
            const user = await signInWithGithub();
            console.log('GitHub sign-in initiated for:', user.email);
            // The onAuthStateChanged listener will handle the rest
            return user;
        } catch (error) {
            console.error('GitHub sign-in error:', error);
            setLoading(false);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await signOutUser();
            console.log('User signed out successfully');
            // The onAuthStateChanged listener will handle cleanup
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    };

    const refreshUserData = async () => {
        if (!user) return null;

        try {
            const response = await axiosInstance.get('/api/users/profile');
            if (response.data.success) {
                setUser(response.data.user);
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
                return response.data.user;
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
        return user;
    };

    const updatePriorities = async (priorities) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const response = await axiosInstance.post('/api/users/priorities', priorities);
            if (response.data.success) {
                const updatedUser = { ...user, lifePriorities: response.data.lifePriorities };
                setUser(updatedUser);
                localStorage.setItem('user_data', JSON.stringify(updatedUser));
                return response.data.lifePriorities;
            }
        } catch (error) {
            console.error('Error updating priorities:', error);
            throw error;
        }
    };

    const getPriorities = async () => {
        if (!user) return { priority1: '', priority2: '', priority3: '' };

        try {
            const response = await axiosInstance.get('/api/users/priorities');
            if (response.data.success) {
                return response.data.lifePriorities;
            }
        } catch (error) {
            console.error('Error fetching priorities:', error);
        }
        
        return user.lifePriorities || { priority1: '', priority2: '', priority3: '' };
    };

    const deductCredits = async (amount = 10, operation = 'analysis') => {
        if (!user) throw new Error('User not authenticated');

        try {
            const response = await axiosInstance.post('/api/users/deduct-credits', {
                amount,
                operation
            });
            
            if (response.data.success) {
                // Update user credits in state
                const updatedUser = { ...user, credits: response.data.credits };
                setUser(updatedUser);
                localStorage.setItem('user_data', JSON.stringify(updatedUser));
                return response.data;
            }
        } catch (error) {
            console.error('Error deducting credits:', error);
            throw error;
        }
    };

    const value = {
        user,
        firebaseUser,
        loading,
        signInWithGoogle: signInWithGoogleProvider,
        signInWithGithub: signInWithGithubProvider,
        signOut,
        refreshUserData,
        updatePriorities,
        getPriorities,
        deductCredits,
        isAuthenticated: !!user,
        hasUnlimitedCredits: user?.isMasterAccount || user?.email === 'adamtpangelinan@gmail.com',
        canPerformAnalysis: (creditCost = 10) => {
            if (!user) return false;
            return user.isMasterAccount || user.email === 'adamtpangelinan@gmail.com' || user.credits >= creditCost;
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
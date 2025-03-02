import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Clear any mock auth if we have a real user
                localStorage.removeItem('mockUserAuth');
            } else {
                // Check for mock authentication
                const mockUserData = localStorage.getItem('mockUserAuth');
                if (mockUserData) {
                    // If we have mock user data, use it
                    const mockUser = JSON.parse(mockUserData);
                    setUser({
                        ...mockUser,
                        // Add extra methods or properties that might be expected
                        getIdToken: () => Promise.resolve('mock-token-for-development'),
                        providerData: [{ providerId: 'mock.google.com' }],
                        // Add a flag so we can detect this is a mock user
                        isMockUser: true
                    });
                } else {
                    setUser(null);
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        loading,
        // Add a utility method to check if using mock auth
        isMockAuth: user?.isMockUser === true
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../axios-config';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [hasPurchased, setHasPurchased] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await axiosInstance.get('/api/purchases/check-purchase', {
                    params: { email: user.email }
                });
                setHasPurchased(response.data.hasPurchased);
            } catch (error) {
                console.error('Error checking purchase status:', error);
                setHasPurchased(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, [user]);

    if (isLoading) {
        // You could add a loading spinner here
        return null;
    }

    if (!user) {
        return <Navigate to="/" />;
    }

    if (!hasPurchased) {
        return <Navigate to="/" />;
    }

    return children;
}

export default ProtectedRoute;
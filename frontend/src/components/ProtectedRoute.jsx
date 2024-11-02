import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          console.error('API URL not configured');
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${apiUrl}/api/check-purchase`,
          {
            params: { email: user.email },
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        setHasAccess(Boolean(response.data.hasPurchased));
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setHasAccess(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
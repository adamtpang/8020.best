// src/components/Landing.jsx

import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, provider } from '../firebase-config';
import { signInWithPopup, signOut } from 'firebase/auth';
import axiosInstance from '../axios-config';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  const [hasPurchased, setHasPurchased] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkPurchaseStatus(user);
    }
  }, [user]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Sign in successful:', result.user.email);
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkPurchaseStatus = async (user) => {
    try {
      console.log('Checking purchase status for:', user.email);
      const response = await axiosInstance.get('/api/purchases/check-purchase', {
        params: { email: user.email }
      });
      console.log('Purchase status response:', {
        data: response.data,
        status: response.status,
        headers: response.headers
      });

      const hasLicense = response.data.hasPurchased;
      console.log('Has license:', hasLicense);
      setHasPurchased(hasLicense);

      if (hasLicense) {
        console.log('User has license, redirecting to app...');
        navigate('/app');
      } else {
        console.log('User does not have license, showing buy button...');
      }
    } catch (error) {
      console.error('Error checking purchase status:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setHasPurchased(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        color: '#ffffff',
        overflow: 'hidden'
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          overflow: 'hidden',
          height: '100%',
          maxHeight: '100vh',
          mt: 12
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#222222',
            p: 2,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #333333',
            overflow: 'hidden'
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#ffffff',
              mb: 2,
              letterSpacing: '-0.02em'
            }}
          >
            8020.best
          </Typography>

          <Box sx={{ mb: 2, maxWidth: '400px' }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', letterSpacing: '0.05em' }}>
              The Problem
            </Typography>
            <Typography sx={{ color: '#cccccc', mb: 2, fontSize: '1rem' }}>
              Your todo list is overwhelming and keeps growing.
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', letterSpacing: '0.05em' }}>
              The Solution
            </Typography>
            <Typography sx={{ color: '#cccccc', mb: 2, fontSize: '1rem' }}>
              Focus on the 20% of tasks that create 80% of impact.
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', letterSpacing: '0.05em' }}>
              How It Works
            </Typography>
            <Typography sx={{ color: '#cccccc', mb: 0, fontSize: '1rem', lineHeight: 1.4 }}>
              1. Paste your todo list<br />
              2. Rate tasks by importance and urgency<br />
              3. Get a focused calendar of high-impact tasks
            </Typography>
          </Box>

          {!user ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button
                onClick={handleGoogleSignIn}
                variant="contained"
                sx={{
                  backgroundColor: '#333333',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#444444'
                  },
                  py: 1.5,
                  px: 5,
                  fontSize: '1rem',
                  fontWeight: 'medium',
                  borderRadius: '8px',
                  textTransform: 'none'
                }}
              >
                Sign in with Google
              </Button>
            </Box>
          ) : !hasPurchased ? (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 2,
                  color: '#cccccc',
                  fontWeight: 'medium'
                }}
              >
                Get instant access to the 80/20 tool
              </Typography>
              <div id="buy-button-container"></div>
            </Box>
          ) : null}
        </Box>

        <Box
          component="a"
          href="https://anchormarianas.com"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#666666',
            textDecoration: 'none',
            '&:hover': {
              color: '#999999'
            }
          }}
        >
          anchormarianas
        </Box>
      </Container>
    </Box>
  );
};

export default Landing;
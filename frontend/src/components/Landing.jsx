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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkPurchaseStatus(user);
    }
  }, [user]);

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
      console.log('Purchase status response:', response.data);

      const hasLicense = response.data.hasPurchased;
      console.log('Has license:', hasLicense);

      // Only sign out if they previously had access (hasPurchased was true)
      if (!hasLicense && hasPurchased) {
        console.log('License was revoked, signing out user...');
        await signOut(auth);
        setHasPurchased(false);
        return;
      }

      setHasPurchased(hasLicense);

      if (hasLicense) {
        console.log('User has license, redirecting to app...');
        navigate('/app');
      } else {
        console.log('User does not have license, showing buy button...');
      }
    } catch (error) {
      console.error('Error checking purchase status:', error);
      setHasPurchased(false);
    }
  };

  const handlePurchase = () => {
    if (!user?.email) return;
    // Construct URL with properly encoded parameters
    const baseUrl = 'https://buy.stripe.com/bIYeXH6aL8EG18c5ko';
    const params = new URLSearchParams({
      client_reference_id: user.email,
      prefilled_email: user.email
    });
    const checkoutUrl = `${baseUrl}?${params.toString()}`;
    console.log('Redirecting to checkout with email:', user.email);
    window.location.href = checkoutUrl;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        p: { xs: 1, sm: 2 },
        color: '#ffffff',
        overflowY: 'auto',
        pb: 4
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          mt: { xs: 4, sm: 8 },
          mb: { xs: 2, sm: 4 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#222222',
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #333333',
            width: '100%',
            maxWidth: '100%'
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
              letterSpacing: '-0.02em',
              fontSize: { xs: '2rem', sm: '3rem' }
            }}
          >
            8020.best
          </Typography>

          <Box
            component="img"
            src="/images/8020best-screenshot.png"
            alt="8020.best screenshot"
            sx={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              borderRadius: 2,
              mb: 3,
              border: '1px solid #333'
            }}
          />

          <Box sx={{ mb: 2, maxWidth: '400px', width: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', letterSpacing: '0.05em' }}>
              The Problem
            </Typography>
            <Typography sx={{ color: '#cccccc', mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Your todo list is overwhelming and keeps growing.
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', letterSpacing: '0.05em' }}>
              The Solution
            </Typography>
            <Typography sx={{ color: '#cccccc', mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Focus on the 20% of tasks that create 80% of impact.
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 'bold', letterSpacing: '0.05em' }}>
              How It Works
            </Typography>
            <Typography sx={{ color: '#cccccc', mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' }, lineHeight: 1.4 }}>
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
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 3, sm: 5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
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
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ minHeight: '50px', width: '100%' }}>
                  <Button
                    onClick={handlePurchase}
                    variant="contained"
                    sx={{
                      backgroundColor: '#635BFF',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#5851E1'
                      },
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 4, sm: 6 },
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      fontWeight: 'medium',
                      borderRadius: '8px',
                      textTransform: 'none',
                      width: '100%',
                      maxWidth: '300px'
                    }}
                  >
                    Buy License
                  </Button>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  Signed in as {user.email}
                </Typography>
                <Button
                  onClick={async () => {
                    await signOut(auth);
                    handleGoogleSignIn();
                  }}
                  variant="outlined"
                  sx={{
                    color: '#999',
                    borderColor: '#333',
                    '&:hover': {
                      borderColor: '#666',
                      backgroundColor: '#222'
                    },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 2, sm: 3 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 'medium',
                    borderRadius: '8px',
                    textTransform: 'none'
                  }}
                >
                  Switch Account
                </Button>
              </Box>
            </Box>
          ) : null}
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: '#999',
            mt: 1,
            textAlign: 'center',
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          by{' '}
          <a
            href="https://adampang.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#999',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = '#999'}
          >
            adampang.com
          </a>
        </Typography>
      </Container>
    </Box>
  );
};

export default Landing;
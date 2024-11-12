// src/components/Landing.jsx

import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, provider } from '../firebase-config';
import { signInWithPopup, signOut } from 'firebase/auth';
import axios from 'axios';

const Landing = () => {
  const [user, setUser] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        checkPurchaseStatus(user);
      }
    });

    return () => unsubscribe();
  }, []);

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
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchases/check-purchase`,
        {
          params: { email: user.email }
        }
      );
      setHasPurchased(Boolean(response.data.hasPurchased));
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  return (
    <Container>
      {/* Auth Controls - Only show Sign Out here */}
      {user && (
        <Box sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar
            src={user.photoURL}
            alt={user.displayName}
            sx={{ width: 40, height: 40 }}
          />
          <Button
            onClick={handleSignOut}
            variant="outlined"
            sx={{
              color: 'black',
              borderColor: 'black',
              '&:hover': {
                borderColor: '#333',
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Sign Out
          </Button>
        </Box>
      )}

      {/* Content */}
      <Grid container spacing={4} justifyContent="center" sx={{ mt: { xs: 8, md: 12 } }}>
        <Grid item xs={12} md={8} textAlign="center">
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 3
            }}
          >
            Are you an overwhelmed achiever?
          </Typography>

          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              color: 'text.secondary',
              mb: 6
            }}
          >
            Cut your todolist by 80% with hower.app
          </Typography>

          {/* Show Google Sign In if not signed in */}
          {!user && (
            <Button
              onClick={handleGoogleSignIn}
              variant="contained"
              size="large"
              sx={{
                mt: 4,
                backgroundColor: 'black',
                py: 2,
                px: 4,
                fontSize: '1.2rem',
                '&:hover': {
                  backgroundColor: '#333'
                }
              }}
            >
              Continue with Google
            </Button>
          )}

          {/* Show Stripe button if signed in but hasn't purchased */}
          {user && !hasPurchased && (
            <Box sx={{ mt: 4 }}>
              <stripe-buy-button
                buy-button-id="buy_btn_1QKAq3FL7C10dNyGNkAnNUXj"
                publishable-key="pk_live_51J7Ti4FL7C10dNyGubXiYMWwF6jPahwvwDjXXooFE9VbI1Brh6igKsmNKAqmFoYflQveSCQ8WR1N47kowzJ1drrQ00ijl4Euus"
                client-reference-id={user.email}
                customer-email={user.email}
                success-url={window.location.origin}
                cancel-url={window.location.origin}
              >
              </stripe-buy-button>
            </Box>
          )}

          {/* Show proceed button if purchased */}
          {user && hasPurchased && (
            <Button
              variant="contained"
              onClick={() => navigate('/app')}
              size="large"
              sx={{
                py: 2.5,
                px: 8,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                backgroundColor: 'black',
                position: 'relative',
                '&:hover': {
                  backgroundColor: '#333',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  background: 'linear-gradient(45deg, #ff0000, #ff8800, #ffd000, #00ff88, #00ffff, #0066ff, #9900ff)',
                  borderRadius: '8px',
                  zIndex: -1,
                  animation: 'borderAnimation 4s linear infinite',
                },
                '@keyframes borderAnimation': {
                  '0%': {
                    filter: 'hue-rotate(0deg)',
                  },
                  '100%': {
                    filter: 'hue-rotate(360deg)',
                  }
                }
              }}
            >
              Ready to 10x your productivity?
            </Button>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Landing;
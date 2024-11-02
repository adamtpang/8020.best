// src/components/Landing.jsx

import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, provider } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import MUI components
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Grid,
  Container,
} from '@mui/material';

const Landing = () => {
  const [user, setUser] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        checkPurchaseStatus(user);
      } else {
        setUser(null);
        setHasPurchased(false);
      }
    });

    // Load Stripe Buy Button script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      unsubscribe();
    };
  }, [user]);

  const checkPurchaseStatus = async (user) => {
    try {
      console.log('Checking purchase status for:', user.email);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/purchases/check-purchase`,
        {
          params: { email: user.email }
        }
      );

      console.log('Purchase status response:', response.data);
      setHasPurchased(Boolean(response.data.hasPurchased));
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Sign in successful:', result.user.email);
      if (result.user?.email) {
        checkPurchaseStatus(result.user);
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      // Handle specific error cases if needed
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in cancelled by user');
      }
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        setHasPurchased(false);
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  };

  const handleContinueToHower = () => {
    navigate('/product');
  };

  const NavBar = () => (
    <AppBar position="static" sx={{ backgroundColor: 'black' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
          hower.app
        </Typography>
        {user && (
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{
              textTransform: 'none',  // Prevents all-caps
              fontSize: '1rem'
            }}
          >
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );

  return (
    <div>
      <NavBar />
      <Container sx={{ mt: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  lineHeight: 1.2
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
                  mb: 6,
                  fontSize: { xs: '1.7rem', sm: '2rem', md: '2.5rem' },
                  lineHeight: 1.2
                }}
              >
                Cut your todo list by 80% with hower.app
              </Typography>

              {!user && (
                <Button
                  variant="contained"
                  onClick={handleGoogleSignIn}
                  size="large"
                  sx={{
                    mt: 4,
                    py: 2,
                    px: 6,
                    fontSize: '1.25rem',
                    backgroundColor: 'black',
                    '&:hover': {
                      backgroundColor: '#333'
                    }
                  }}
                >
                  Continue with Google
                </Button>
              )}
            </Box>
          </Grid>

          {/* Purchase or Continue Section */}
          {user && !hasPurchased && (
            <Grid item xs={12} sx={{ textAlign: 'center', mt: 4 }}>
              <stripe-buy-button
                buy-button-id="buy_btn_1Q8WGpFL7C10dNyGiDnbvoQB"
                publishable-key="pk_live_51J7Ti4FL7C10dNyGubXiYMWwF6jPahwvwDjXXooFE9VbI1Brh6igKsmNKAqmFoYflQveSCQ8WR1N47kowzJ1drrQ00ijl4Euus"
              >
              </stripe-buy-button>
            </Grid>
          )}
          {user && hasPurchased && (
            <Grid item xs={12} sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                onClick={handleContinueToHower}
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
                Ready to become 10x more productive?
              </Button>
            </Grid>
          )}
        </Grid>
      </Container>
    </div>
  );
};

export default Landing;
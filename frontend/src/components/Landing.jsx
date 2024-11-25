// src/components/Landing.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container } from '@mui/material';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 4
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Hower
        </Typography>

        <Typography variant="h5" gutterBottom>
          Organize your thoughts, prioritize your tasks
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/app')}
          sx={{
            backgroundColor: 'black',
            '&:hover': {
              backgroundColor: '#333'
            },
            padding: '12px 32px',
            fontSize: '1.2rem'
          }}
        >
          Get Started
        </Button>
      </Box>
    </Container>
  );
};

export default Landing;
import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC',
    },
    secondary: {
      main: '#03DAC6',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#A8A8A8'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212'
    }}
  >
    <CircularProgress size={60} sx={{ mb: 2 }} />
    <Box sx={{ textAlign: 'center' }}>
      <img
        src="/images/8020-logo.png"
        alt="8020.best"
        style={{ height: '40px', opacity: 0.7, marginBottom: '16px' }}
      />
    </Box>
  </Box>
);

function AppContent() {
  const [showLanding, setShowLanding] = useState(true);

  // Check if user has previously visited
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (hasVisited) {
      setShowLanding(false);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('hasVisited', 'true');
    setShowLanding(false);
  };

  return (
    <>
      {showLanding ? (
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        <MainApp />
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ClerkProvider } from '@clerk/clerk-react';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';
import { CLERK_PUBLISHABLE_KEY, clerkConfig } from './config/clerk';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CAF50',
    },
    secondary: {
      main: '#2196F3',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});


function App() {
  const [showLanding, setShowLanding] = useState(true);

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  // If no Clerk key is provided, show a simplified version
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        {showLanding ? (
          <LandingPage onGetStarted={handleGetStarted} />
        ) : (
          <MainApp />
        )}
      </ThemeProvider>
    );
  }

  return (
    <ClerkProvider {...clerkConfig}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <LandingPage onGetStarted={handleGetStarted} />
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
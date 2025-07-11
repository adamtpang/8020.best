import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';

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

export default App;
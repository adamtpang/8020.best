import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <div className="text-center">
      <img
        src="/images/8020-logo.png"
        alt="8020.best"
        className="h-10 opacity-70 mb-4"
      />
    </div>
  </div>
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
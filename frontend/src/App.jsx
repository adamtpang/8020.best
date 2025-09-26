import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
  // Always show the LandingPage - no more switching to MainApp
  // The only difference will be the header (sign in vs profile + credits)
  return <LandingPage />;
}

function App() {
  return (
    <div className="dark font-sans antialiased">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </div>
  );
}

export default App;
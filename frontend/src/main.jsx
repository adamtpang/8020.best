import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
// Leave AuthProvider commented out for now
// import { AuthProvider } from './contexts/AuthContext';
import App from './App.jsx';
import './index.css';

// Use import.meta.env instead of process.env
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      {/* Leave AuthProvider commented out for now */}
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
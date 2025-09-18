import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let auth;
let googleProvider;
let githubProvider;

try {
  // Check if we have the required config
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Configure providers
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');

    githubProvider = new GithubAuthProvider();
    githubProvider.addScope('user:email');
    
    console.log('Firebase initialized successfully');
  } else {
    console.log('Firebase config not available, using mock implementations');
    throw new Error('Firebase config missing');
  }
} catch (error) {
  console.log('Firebase initialization failed, using mock implementations:', error.message);
  
  // Mock implementations for development
  app = { name: 'mock-firebase-app', options: {} };
  
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      console.log('Mock Firebase: onAuthStateChanged called');
      return () => {};
    },
    signInWithPopup: (provider) => {
      console.log('Mock Firebase: signInWithPopup called');
      const mockUser = {
        uid: 'mock-uid-' + Date.now(),
        email: provider.providerId === 'google.com' ? 'mock-google@example.com' : 'mock-github@example.com',
        displayName: 'Mock User',
        photoURL: 'https://via.placeholder.com/150',
        providerId: provider.providerId
      };
      return Promise.resolve({ user: mockUser });
    },
    signOut: () => {
      console.log('Mock Firebase: signOut called');
      return Promise.resolve();
    }
  };

  googleProvider = {
    addScope: () => {},
    setCustomParameters: () => {},
    providerId: 'google.com'
  };

  githubProvider = {
    addScope: () => {},
    setCustomParameters: () => {},
    providerId: 'github.com'
  };

}

// Authentication helper functions
export const signInWithGoogle = async () => {
  try {
    // Try popup first, fallback to redirect if blocked
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.log('Popup blocked, using redirect method');
      await signInWithRedirect(auth, googleProvider);
      return null; // User will be redirected
    }
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signInWithGithub = async () => {
  try {
    // Try popup first, fallback to redirect if blocked
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.log('Popup blocked, using redirect method');
      await signInWithRedirect(auth, githubProvider);
      return null; // User will be redirected
    }
    console.error('GitHub sign-in error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
};

export { auth, googleProvider, githubProvider, onAuthStateChanged, getRedirectResult };
export default app;

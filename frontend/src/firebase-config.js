// Mock Firebase configuration for development
// This file provides mock implementations of Firebase services
// to prevent errors when Firebase credentials are not available

// Create mock implementations
const app = {
  name: 'mock-firebase-app',
  options: {}
};

const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    console.log('Mock Firebase: onAuthStateChanged called');
    // Return an unsubscribe function
    return () => { };
  },
  signInWithEmailAndPassword: (email, password) => {
    console.log('Mock Firebase: signInWithEmailAndPassword called with', email);
    return Promise.resolve({ user: { email, uid: 'mock-uid' } });
  },
  signInWithPopup: () => {
    console.log('Mock Firebase: signInWithPopup called');
    return Promise.resolve({
      user: { email: 'mock-google@example.com', uid: 'mock-google-uid' }
    });
  },
  signOut: () => {
    console.log('Mock Firebase: signOut called');
    return Promise.resolve();
  }
};

const provider = {
  addScope: () => { },
  setCustomParameters: () => { },
  providerId: 'google.com'
};

const analytics = {
  logEvent: (eventName, params) => {
    console.log('Mock Firebase Analytics: logEvent', eventName, params);
  }
};

// Export mock objects
export { auth, provider, analytics };
export default app;

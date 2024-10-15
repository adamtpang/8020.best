import { initializeApp } from 'firebase/app';
     import { getAuth } from 'firebase/auth'; // Import getAuth
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWb19J68H1l6J0wbetZ5QUZ69JdEnMPDM",
  authDomain: "howerdotapp.firebaseapp.com",
  projectId: "howerdotapp",
  storageBucket: "howerdotapp.appspot.com",
  messagingSenderId: "307357602530",
  appId: "1:307357602530:web:74c747b9e861c0475304bb",
  measurementId: "G-TZJTKDT7JC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Get the auth object

export { auth }; // Export the auth object
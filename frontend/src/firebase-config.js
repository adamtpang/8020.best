// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWb19J68H1l6J0wbetZ5QUZ69JdEnMPDM",
  authDomain: "howerdotapp.firebaseapp.com",
  projectId: "howerdotapp",
  storageBucket: "howerdotapp.firebasestorage.app",
  messagingSenderId: "307357602530",
  appId: "1:307357602530:web:74c747b9e861c0475304bb",
  measurementId: "G-TZJTKDT7JC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
    
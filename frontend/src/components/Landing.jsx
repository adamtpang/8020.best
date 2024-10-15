import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import axios from 'axios';
import '../styles/Landing.css';

const Landing = () => {
  const [user, setUser] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User logged in:', user.email); // Log the user's email when they log in
        setUser(user); // Set user data from Firebase
        checkPurchaseStatus(user); // Check purchase status using Firebase user data
      } else {
        console.log('No user logged in or user logged out'); // Log when no user is logged in
        setUser(null);
        setHasPurchased(false);
      }
    });

    // Set up Google One-Tap Sign-In if no user is logged in
    if (!user) {
      console.log('Initializing Google One-Tap sign-in'); // Log when initializing Google One-Tap
      window.google?.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleSignInCallback,
      });
      window.google?.accounts.id.prompt();
    }

    // Load Stripe Buy Button script
    console.log('Loading Stripe Buy Button script'); // Log when loading Stripe script
    const stripeScript = document.createElement('script');
    stripeScript.src = 'https://js.stripe.com/v3/buy-button.js';
    stripeScript.async = true;
    document.body.appendChild(stripeScript);

    return () => {
      console.log('Cleaning up'); // Log when the component unmounts and cleanup is done
      document.body.removeChild(stripeScript);
      unsubscribe();
    };
  }, [user]);


  // Landing.jsx

const checkPurchaseStatus = async (user) => {
  if (!user || !user.email) {
    console.error('User or user email is not available');
    setHasPurchased(false);
    return;
  }

  console.log('Checking purchase status for user:', user.email);

  try {
    // Use the environment variable from Vite
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/check-purchase`,
      {
        params: { email: user.email },
      }
    );

    console.log('Full response from server:', response);

    if (
      response &&
      response.data &&
      typeof response.data.hasPurchased !== 'undefined'
    ) {
      setHasPurchased(Boolean(response.data.hasPurchased));
      console.log(
        `User ${user.email} has purchased: ${Boolean(
          response.data.hasPurchased
        )}`
      );
    } else {
      console.warn(
        `Server response for ${user.email} did not include hasPurchased or was malformed.`
      );
      setHasPurchased(false);
    }
  } catch (error) {
    console.error('Error checking purchase status:', error);
    setHasPurchased(false);
  }
};


  const handleGoogleSignIn = () => {
    console.log('Attempting Google sign-in...'); // Log when the sign-in starts
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log('User signed in successfully:', result.user.email); // Log the signed-in user
        setUser(result.user);

        // Check the user's purchase status
        if (result.user && result.user.email) {
          checkPurchaseStatus(result.user);
        }
      })
      .catch((error) => {
        console.error('Error during sign-in:', error); // Log any error during sign-in
      });
  };


  const handleGoogleSignInCallback = (response) => {
    console.log('Google One-Tap Response:', response);
  };


  const handleLogout = () => {
    console.log('Attempting to sign out...'); // Log when logout starts
    signOut(auth)
      .then(() => {
        console.log('User signed out successfully'); // Log successful logout
        setUser(null);
        setHasPurchased(false);
      })
      .catch((error) => {
        console.error('Error during logout:', error); // Log any error during logout
      });
  };


  const handleContinueToHower = () => {
    navigate('/product');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const UserAvatar = ({ user }) => {
    const initials = getInitials(user.displayName || 'User Name');
    return (
      <div className="avatar-container">
        {user.photoURL ? (
          <img src={user.photoURL} alt="User" className="avatar" />
        ) : (
          <div className="initials-avatar">
            {initials}
          </div>
        )}
      </div>
    );
  };

  const NavBar = () => (
    <nav className="navbar">
      <h2 className="nav-title">hower.app</h2>
      {user && (
        <div className="nav-user">
          <UserAvatar user={user} />
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );

  return (
    <div className="container">
      <NavBar />
      <div className="content">
        <img src={logoImage} alt="Hower Logo" className="logo" />
        <h1 className="title">hower.app</h1>
        <h3 className="subtitle">Do less, achieve more.</h3>
        <p className="description">
          Overwhelmed by your to-do list?
          <br />
          Lots of creative ideas but don't know where to start?
          <br />
          Hower can help :)
        </p>
        {!user && (
          <button className="button" onClick={handleGoogleSignIn}>
            Continue with Google
          </button>
        )}
        {user && (
          <div className="card">
            <UserAvatar user={user} />
            <div className="card-body">
              <p className="welcome-text">Welcome, {user.displayName}!</p>
              {hasPurchased ? (
                <button className="button" onClick={handleContinueToHower}>
                  Proceed to Hower
                </button>
              ) : (
                <stripe-buy-button
                  buy-button-id="buy_btn_1Q8WGpFL7C10dNyGiDnbvoQB"
                  publishable-key="pk_live_51J7Ti4FL7C10dNyGy2ZUp791IXhOiFpGLDcHMTwl6sUMG5p9paNbeJFjKkz1VTbIcMqiQAR32d5aO6zvzxxVwOIv00uWhizkxZ"
                ></stripe-buy-button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;

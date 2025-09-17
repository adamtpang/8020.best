import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Box,
} from '@mui/material';

export default function CleanLoginDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          border: 'none',
          borderRadius: 1,
        }
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <DialogTitle sx={{
            fontSize: '1.5rem',
            fontWeight: 300,
            color: 'black',
            p: 0,
            mb: 1
          }}>
            Sign In
          </DialogTitle>
          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 300 }}>
            Continue with your Google account
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          {error && (
            <Box sx={{
              fontSize: '0.875rem',
              color: '#ef4444',
              textAlign: 'center',
              backgroundColor: '#fef2f2',
              p: 1.5,
              borderRadius: 1,
              mb: 2
            }}>
              {error}
            </Box>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            fullWidth
            sx={{
              height: 48,
              backgroundColor: 'black',
              color: 'white',
              fontWeight: 300,
              fontSize: '1rem',
              border: 'none',
              borderRadius: 0.5,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#374151',
              },
              '&:disabled': {
                backgroundColor: '#6b7280',
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                <span>Signing in...</span>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Box>
            )}
          </Button>
        </Box>

        <Typography variant="caption" sx={{
          textAlign: 'center',
          color: '#6b7280',
          display: 'block',
          mt: 2
        }}>
          By signing in, you agree to our terms of service
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
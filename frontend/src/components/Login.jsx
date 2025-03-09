import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Divider,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useGoogleLogin } from '@react-oauth/google';
import AuthService from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ email, password });
            // Check if user has credits
            const response = await api.get('/api/purchases/credits');
            if (response.data.credits === 0) {
                // User has no credits, give them the free credits
                await api.post('/api/admin/grant-free-credits', {
                    email,
                    amount: 1000
                });
                setSuccessMessage('Welcome! 1000 free AI credits have been added to your account.');
            }
            navigate('/app');
        } catch (err) {
            console.error('Login error:', err);
            setError(
                err.response?.data?.message ||
                'Failed to log in. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle Google login
    const googleLogin = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                setLoading(true);
                setError('');

                // Get access token and send to backend
                const { access_token } = response;
                const authResponse = await AuthService.googleAuth(access_token);

                // Check if this is a new user or if they have no credits
                if (authResponse.isNewUser || authResponse.user.credits === 0) {
                    // Grant free credits to new users
                    await api.post('/api/admin/grant-free-credits', {
                        email: authResponse.user.email,
                        amount: 1000
                    });
                    setSuccessMessage('Welcome! 1000 free AI credits have been added to your account.');
                }

                // Redirect to app on success
                navigate('/app');
            } catch (err) {
                console.error('Google login error:', err);
                setError('Failed to log in with Google. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        onError: (error) => {
            console.error('Google login error:', error);
            setError('Failed to log in with Google. Please try again.');
        }
    });

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper sx={{ p: 4, width: '100%' }} elevation={3}>
                    <Typography component="h2" variant="h5" align="center" gutterBottom>
                        Sign In
                    </Typography>

                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMessage}
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Chip
                            label="New users get 1000 FREE AI credits!"
                            color="success"
                            sx={{ fontWeight: 'bold', mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" align="center">
                            Each line of text uses 1 credit when analyzed.
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>

                        <Divider sx={{ my: 2 }}>OR</Divider>

                        <Button
                            fullWidth
                            variant="outlined"
                            color="primary"
                            startIcon={<GoogleIcon />}
                            onClick={() => googleLogin()}
                            disabled={loading}
                            sx={{ mb: 2 }}
                        >
                            Sign in with Google
                        </Button>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2">
                                Don't have an account?{' '}
                                <Link to="/register" style={{ textDecoration: 'none' }}>
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Divider,
    Paper,
    Stack
} from '@mui/material';
import { Google as GoogleIcon, GitHub as GitHubIcon, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginDialog = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [provider, setProvider] = useState('');
    const { signInWithGoogle, signInWithGithub } = useAuth();

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError('');
            setProvider('google');
            await signInWithGoogle();
            onClose();
        } catch (error) {
            console.error('Google sign-in failed:', error);
            setError(error.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
            setProvider('');
        }
    };

    const handleGithubSignIn = async () => {
        try {
            setLoading(true);
            setError('');
            setProvider('github');
            await signInWithGithub();
            onClose();
        } catch (error) {
            console.error('GitHub sign-in failed:', error);
            setError(error.message || 'Failed to sign in with GitHub');
        } finally {
            setLoading(false);
            setProvider('');
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError('');
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <LoginIcon sx={{ fontSize: 48, mb: 1, color: 'primary.main' }} />
                <Typography variant="h5" component="div" fontWeight="bold">
                    Welcome to 8020.best
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Sign in to save your priorities and track your credits
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                        {error}
                    </Alert>
                )}

                <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                        ✨ What you get:
                    </Typography>
                    <Stack spacing={1} sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            🎯 <Box component="span" sx={{ ml: 1 }}>Persistent life priorities</Box>
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            💎 <Box component="span" sx={{ ml: 1 }}>1000 free AI credits</Box>
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            📊 <Box component="span" sx={{ ml: 1 }}>Usage tracking & analytics</Box>
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            🔒 <Box component="span" sx={{ ml: 1 }}>Secure OAuth authentication</Box>
                        </Typography>
                    </Stack>

                    <Divider sx={{ my: 2, opacity: 0.3 }} />

                    <Stack spacing={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            startIcon={
                                loading && provider === 'google' ? 
                                    <CircularProgress size={20} /> : 
                                    <GoogleIcon />
                            }
                            sx={{
                                py: 1.5,
                                bgcolor: '#4285f4',
                                '&:hover': { bgcolor: '#3367d6' },
                                borderRadius: '8px'
                            }}
                        >
                            {loading && provider === 'google' ? 'Signing in...' : 'Continue with Google'}
                        </Button>

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleGithubSignIn}
                            disabled={loading}
                            startIcon={
                                loading && provider === 'github' ? 
                                    <CircularProgress size={20} /> : 
                                    <GitHubIcon />
                            }
                            sx={{
                                py: 1.5,
                                bgcolor: '#24292e',
                                '&:hover': { bgcolor: '#1b1f23' },
                                borderRadius: '8px'
                            }}
                        >
                            {loading && provider === 'github' ? 'Signing in...' : 'Continue with GitHub'}
                        </Button>
                    </Stack>
                </Paper>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                    By signing in, you agree to our terms of service and privacy policy.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ pt: 0, pb: 3, px: 3 }}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    fullWidth
                    variant="text"
                    sx={{ color: 'text.secondary' }}
                >
                    Continue without signing in
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoginDialog;
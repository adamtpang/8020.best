import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert
} from '@mui/material';
import { updateUserCredits } from '../../../services/api';

const AdminDialog = ({ open, onClose }) => {
    const [userEmail, setUserEmail] = useState('');
    const [credits, setCredits] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await updateUserCredits(userEmail, parseInt(credits));
            setSuccess(`Successfully updated credits for ${userEmail}`);
            setUserEmail('');
            setCredits('');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update credits');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Admin: Manage User Credits</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        label="User Email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        margin="normal"
                        required
                        type="email"
                    />
                    <TextField
                        fullWidth
                        label="Credits to Add"
                        value={credits}
                        onChange={(e) => setCredits(e.target.value)}
                        margin="normal"
                        required
                        type="number"
                        helperText="Use negative numbers to remove credits"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!userEmail || !credits}
                >
                    Update Credits
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminDialog;
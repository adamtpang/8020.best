import React, { useState } from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Typography,
    Box,
    Divider,
    Chip,
    ListItemIcon,
    ListItemText,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Alert
} from '@mui/material';
import {
    AccountCircle,
    ExitToApp,
    Settings,
    CreditCard,
    Star,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const PrioritiesDialog = ({ open, onClose, user, onSave }) => {
    const [priorities, setPriorities] = useState({
        priority1: user?.lifePriorities?.priority1 || '',
        priority2: user?.lifePriorities?.priority2 || '',
        priority3: user?.lifePriorities?.priority3 || ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            await onSave(priorities);
            onClose();
        } catch (error) {
            setError(error.message || 'Failed to save priorities');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setPriorities({
                priority1: user?.lifePriorities?.priority1 || '',
                priority2: user?.lifePriorities?.priority2 || '',
                priority3: user?.lifePriorities?.priority3 || ''
            });
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
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <EditIcon color="primary" />
                    <Typography variant="h6">Edit Life Priorities</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    These priorities help the AI give you better task recommendations
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <TextField
                        label="Priority #1"
                        fullWidth
                        multiline
                        maxRows={2}
                        value={priorities.priority1}
                        onChange={(e) => setPriorities(prev => ({ ...prev, priority1: e.target.value }))}
                        placeholder="e.g., Advance my career in software engineering"
                        disabled={saving}
                    />
                    <TextField
                        label="Priority #2"
                        fullWidth
                        multiline
                        maxRows={2}
                        value={priorities.priority2}
                        onChange={(e) => setPriorities(prev => ({ ...prev, priority2: e.target.value }))}
                        placeholder="e.g., Improve my health and fitness"
                        disabled={saving}
                    />
                    <TextField
                        label="Priority #3"
                        fullWidth
                        multiline
                        maxRows={2}
                        value={priorities.priority3}
                        onChange={(e) => setPriorities(prev => ({ ...prev, priority3: e.target.value }))}
                        placeholder="e.g., Spend quality time with family"
                        disabled={saving}
                    />
                </Stack>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
                <Button 
                    onClick={handleClose} 
                    startIcon={<CloseIcon />}
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Priorities'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const UserMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [prioritiesOpen, setPrioritiesOpen] = useState(false);
    const { user, signOut, updatePriorities, hasUnlimitedCredits } = useAuth();
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            handleClose();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handlePrioritiesSave = async (priorities) => {
        await updatePriorities(priorities);
    };

    const formatCredits = (credits) => {
        if (hasUnlimitedCredits) return '∞';
        return credits?.toLocaleString() || '0';
    };

    const getAccountTypeColor = (accountType) => {
        switch (accountType) {
            case 'master': return 'warning';
            case 'premium': return 'primary';
            default: return 'default';
        }
    };

    if (!user) return null;

    return (
        <>
            <IconButton
                onClick={handleClick}
                sx={{
                    p: 0,
                    ml: 2,
                    border: '2px solid transparent',
                    '&:hover': { border: '2px solid rgba(255,255,255,0.2)' }
                }}
            >
                <Avatar
                    src={user.profilePicture}
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.main'
                    }}
                >
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </Avatar>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 280,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* User Info Header */}
                <Box sx={{ p: 2, pb: 1 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar src={user.profilePicture} sx={{ width: 48, height: 48 }}>
                            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="body1" fontWeight="bold">
                                {user.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {user.email}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip
                            label={user.accountType?.toUpperCase() || 'FREE'}
                            size="small"
                            color={getAccountTypeColor(user.accountType)}
                            icon={user.isMasterAccount ? <Star /> : undefined}
                        />
                        <Chip
                            label={`${formatCredits(user.credits)} credits`}
                            size="small"
                            icon={<CreditCard />}
                            variant="outlined"
                        />
                    </Box>
                </Box>

                <Divider sx={{ opacity: 0.3 }} />

                <MenuItem onClick={() => { setPrioritiesOpen(true); handleClose(); }}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Edit Priorities"
                        secondary="Set your life goals for better AI recommendations"
                    />
                </MenuItem>

                <MenuItem onClick={handleSignOut}>
                    <ListItemIcon>
                        <ExitToApp fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sign Out" />
                </MenuItem>
            </Menu>

            <PrioritiesDialog
                open={prioritiesOpen}
                onClose={() => setPrioritiesOpen(false)}
                user={user}
                onSave={handlePrioritiesSave}
            />
        </>
    );
};

export default UserMenu;
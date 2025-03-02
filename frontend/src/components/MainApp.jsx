import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    TextField,
    Grid,
    Paper,
    Chip,
    Divider,
    IconButton,
    Tooltip,
    AppBar,
    Toolbar,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import {
    ContentPaste as PasteIcon,
    ContentCopy as CopyIcon,
    Info as InfoIcon,
    DeleteOutline as DeleteIcon,
    AutoAwesome as AnalyzeIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    CreditCard as CreditIcon
} from '@mui/icons-material';
import { auth, provider } from '../firebase-config';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { analyzeTasks as analyzeTasksAPI, categorizeTasks } from '../services/aiPrioritization';
import { getCredits } from '../services/api';
import InstructionsDialog from './Product/dialogs/InstructionsDialog';
import CreditPurchaseDialog from './Product/dialogs/CreditPurchaseDialog';
import ItemList from './Product/ItemList';

const MainApp = () => {
    // Authentication state
    const { user } = useAuth();

    // Task lists state
    const [list1, setList1] = useState([]);
    const [list2, setList2] = useState([]);
    const [list3, setList3] = useState([]);
    const [activeTab, setActiveTab] = useState(0);

    // Input state
    const [tasksInput, setTasksInput] = useState('');

    // UI state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

    // Credits state
    const [credits, setCredits] = useState(null);
    const [showCreditPurchase, setShowCreditPurchase] = useState(false);
    const [creditsNeeded, setCreditsNeeded] = useState(1);

    // Load credits if user is logged in
    useEffect(() => {
        if (user) {
            loadCredits();
        }
    }, [user]);

    // Load tasks from localStorage
    useEffect(() => {
        if (user) {
            loadTasksFromStorage();
        }
    }, [user]);

    // Load credits function
    const loadCredits = async () => {
        try {
            const data = await getCredits();
            setCredits(data.credits);
        } catch (error) {
            console.error('Error loading credits:', error);
        }
    };

    // Load tasks from localStorage
    const loadTasksFromStorage = () => {
        try {
            const savedLists = JSON.parse(localStorage.getItem(`tasks_${user.uid}`)) || {};
            setList1(savedLists.list1 || []);
            setList2(savedLists.list2 || []);
            setList3(savedLists.list3 || []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    // Save tasks to localStorage
    const saveTasks = () => {
        try {
            localStorage.setItem(`tasks_${user.uid}`, JSON.stringify({
                list1,
                list2,
                list3
            }));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    };

    // Save when lists change
    useEffect(() => {
        if (user) {
            saveTasks();
        }
    }, [list1, list2, list3]);

    // Handle sign in with Google
    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Error during sign-in:', error);

            // Check if it's a domain authorization error
            if (error.code === 'auth/unauthorized-domain') {
                setNotification({
                    open: true,
                    message: 'For development: Using test account instead of Google sign-in.',
                    severity: 'warning'
                });

                // Mock user authentication for development
                // This simulates a signed-in user with 100 credits
                localStorage.setItem('mockUserAuth', JSON.stringify({
                    uid: 'dev-user-123',
                    email: 'dev@example.com',
                    displayName: 'Development User',
                }));

                // Simulate auth state change
                window.location.reload();
            } else {
                setNotification({
                    open: true,
                    message: 'Sign in failed. Please try again.',
                    severity: 'error'
                });
            }
        }
    };

    // Handle sign out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Handle analyze tasks
    const handleAnalyzeTasks = async () => {
        if (!tasksInput.trim() && list1.length === 0) {
            setNotification({
                open: true,
                message: 'Please enter some tasks to analyze.',
                severity: 'warning'
            });
            return;
        }

        // Parse input tasks if needed
        if (tasksInput.trim()) {
            const newTasks = tasksInput.split('\n')
                .map(task => task.trim())
                .filter(task => task.length > 0);

            setList1(prev => [...newTasks, ...prev]);
            setTasksInput('');
        }

        const tasksToAnalyze = [...list1];

        try {
            setIsAnalyzing(true);
            const analysis = await analyzeTasksAPI(tasksToAnalyze);
            const { important, urgent, regular } = categorizeTasks(tasksToAnalyze, analysis);

            setList1(regular);
            setList2(important);
            setList3(urgent);

            setNotification({
                open: true,
                message: 'Tasks analyzed successfully!',
                severity: 'success'
            });

            // Update credits from localStorage if available
            const updatedCredits = localStorage.getItem('credits');
            if (updatedCredits) {
                setCredits(Number(updatedCredits));
            }
        } catch (error) {
            console.error('Error during analysis:', error);
            setNotification({
                open: true,
                message: 'Failed to analyze tasks. Please try again.',
                severity: 'error'
            });

            // Check if error is due to insufficient credits
            if (error.response && error.response.status === 403) {
                const needed = error.response.data.creditsNeeded || 1;
                setCreditsNeeded(needed);
                setShowCreditPurchase(true);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle paste from clipboard
    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setTasksInput(text);
            }
        } catch (error) {
            console.error('Failed to paste from clipboard:', error);
            setNotification({
                open: true,
                message: 'Failed to paste from clipboard. Please try manually.',
                severity: 'error'
            });
        }
    };

    // Handle delete items
    const handleDeleteItems = (listNumber, items) => {
        switch (listNumber) {
            case 1:
                setList1(prev => prev.filter(item => !items.includes(item)));
                break;
            case 2:
                setList2(prev => prev.filter(item => !items.includes(item)));
                break;
            case 3:
                setList3(prev => prev.filter(item => !items.includes(item)));
                break;
        }
    };

    // Calculate credits that will be used
    const getCreditsRequired = () => {
        const taskCount = tasksInput.split('\n')
            .filter(task => task.trim().length > 0)
            .length + list1.length;

        if (taskCount === 0) return 0;
        // Each task costs 1 credit
        return taskCount;
    };

    // Render landing screen
    const renderLandingScreen = () => (
        <Container maxWidth="md" sx={{ pt: 8, pb: 8 }}>
            <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom
                            sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                            AI Task Prioritization
                        </Typography>
                        <Typography variant="h5" component="h2" color="text.secondary"
                            sx={{ mb: 4, fontWeight: 300 }}>
                            Focus on what truly matters
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
                            <Button
                                variant="contained"
                                size="large"
                                color="primary"
                                onClick={handleGoogleSignIn}
                                startIcon={<LoginIcon />}
                                sx={{
                                    mr: 2,
                                    py: 1.5,
                                    px: 4,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1.1rem'
                                }}
                            >
                                Sign in with Google
                            </Button>
                            <Chip
                                label="100 free credits"
                                color="success"
                                sx={{ fontWeight: 500 }}
                            />
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={6}
                        sx={{
                            p: 4,
                            bgcolor: 'background.paper',
                            borderRadius: 4,
                            height: '100%',
                            minHeight: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '120px',
                                height: '120px',
                                bgcolor: 'primary.light',
                                opacity: 0.15,
                                borderRadius: '0 0 0 100%'
                            }}
                        />
                        <Typography variant="h5" gutterBottom fontWeight="500" sx={{ mb: 3 }}>
                            How It Works
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5, position: 'relative', zIndex: 2 }}>
                            <Box sx={{
                                minWidth: 36,
                                height: 36,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                fontWeight: 'bold'
                            }}>
                                1
                            </Box>
                            <Typography>Paste your tasks (one per line)</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5, position: 'relative', zIndex: 2 }}>
                            <Box sx={{
                                minWidth: 36,
                                height: 36,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                fontWeight: 'bold'
                            }}>
                                2
                            </Box>
                            <Typography>AI analyzes importance & urgency</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                            <Box sx={{
                                minWidth: 36,
                                height: 36,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                fontWeight: 'bold'
                            }}>
                                3
                            </Box>
                            <Typography>Focus on high-impact tasks first</Typography>
                        </Box>

                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '120px',
                                height: '120px',
                                bgcolor: 'success.light',
                                opacity: 0.15,
                                borderRadius: '0 100% 0 0'
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );

    // Render application screen
    const renderAppScreen = () => (
        <Container maxWidth="md" sx={{ mb: 8 }}>
            {/* Task Input Section */}
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mb: 4,
                    mt: 3,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '5px',
                        bgcolor: 'primary.main'
                    }}
                />

                <Typography variant="h5" gutterBottom fontWeight="500">
                    AI Task Prioritization
                </Typography>

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Paste your tasks here, one per line..."
                    value={tasksInput}
                    onChange={e => setTasksInput(e.target.value)}
                    sx={{
                        mb: 3,
                        mt: 2,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyzeIcon />}
                            onClick={handleAnalyzeTasks}
                            disabled={isAnalyzing || (tasksInput.trim() === '' && list1.length === 0)}
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                                textTransform: 'none'
                            }}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Tasks'}
                        </Button>
                        <Tooltip title="Paste from clipboard">
                            <IconButton onClick={handlePasteFromClipboard} color="primary" sx={{ ml: 1 }}>
                                <PasteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            icon={<CreditIcon fontSize="small" />}
                            label={credits !== null ? `${credits} credits` : '...'}
                            color={credits > 0 ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                        />
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => setShowCreditPurchase(true)}
                            sx={{
                                ml: 1,
                                borderRadius: 2,
                                textTransform: 'none'
                            }}
                        >
                            Buy Credits
                        </Button>
                    </Box>
                </Box>

                {getCreditsRequired() > 0 && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            display: 'block',
                            mt: 2,
                            fontStyle: 'italic'
                        }}
                    >
                        This will use {getCreditsRequired()} credit{getCreditsRequired() > 1 ? 's' : ''}
                    </Typography>
                )}
            </Paper>

            {/* Task Lists Section */}
            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    textColor="primary"
                    indicatorColor="primary"
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            py: 2
                        }
                    }}
                >
                    <Tab
                        label={`Unimportant (${list1.length})`}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                    />
                    <Tab
                        label={`Important (${list2.length})`}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                    />
                    <Tab
                        label={`Urgent (${list3.length})`}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                    />
                </Tabs>

                <Box sx={{
                    p: 3,
                    minHeight: '300px',
                    bgcolor: 'background.paper',
                    borderTop: 0
                }}>
                    {activeTab === 0 && (
                        <ItemList
                            items={list1}
                            onDeleteItems={items => handleDeleteItems(1, items)}
                            emptyMessage="No unimportant tasks yet"
                        />
                    )}
                    {activeTab === 1 && (
                        <ItemList
                            items={list2}
                            onDeleteItems={items => handleDeleteItems(2, items)}
                            emptyMessage="No important tasks yet"
                        />
                    )}
                    {activeTab === 2 && (
                        <ItemList
                            items={list3}
                            onDeleteItems={items => handleDeleteItems(3, items)}
                            emptyMessage="No urgent tasks yet"
                        />
                    )}
                </Box>
            </Paper>
        </Container>
    );

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f9f9f9'
        }}>
            {/* App Bar */}
            <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 'bold',
                            color: 'primary.main'
                        }}>
                        8020.best
                    </Typography>

                    <Tooltip title="How it works">
                        <IconButton color="inherit" onClick={() => setIsInstructionsOpen(true)} sx={{ mr: 1 }}>
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>

                    {user ? (
                        <>
                            {credits !== null && (
                                <Chip
                                    icon={<CreditIcon fontSize="small" />}
                                    label={`${credits} credits`}
                                    color={credits > 0 ? 'primary' : 'error'}
                                    size="small"
                                    sx={{ mr: 2, fontWeight: 500 }}
                                />
                            )}
                            <Tooltip title="Sign out">
                                <IconButton color="inherit" onClick={handleSignOut}>
                                    <LogoutIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    ) : null}
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    py: { xs: 2, md: 4 }
                }}
            >
                {user ? renderAppScreen() : renderLandingScreen()}
            </Box>

            {/* Notification */}
            {notification.open && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000,
                        bgcolor: notification.severity === 'success' ? 'success.main' :
                            notification.severity === 'error' ? 'error.main' : 'warning.main',
                        color: '#fff',
                        borderRadius: 8,
                        py: 1.5,
                        px: 3,
                        minWidth: 250,
                        maxWidth: '90%',
                        textAlign: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                >
                    <Typography>{notification.message}</Typography>
                </Box>
            )}

            {/* Dialogs */}
            <InstructionsDialog
                open={isInstructionsOpen}
                onClose={() => setIsInstructionsOpen(false)}
            />

            <CreditPurchaseDialog
                open={showCreditPurchase}
                onClose={() => setShowCreditPurchase(false)}
                creditsNeeded={creditsNeeded}
            />
        </Box>
    );
};

export default MainApp;
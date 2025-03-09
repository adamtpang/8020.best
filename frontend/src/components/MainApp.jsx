import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Snackbar,
    Alert,
    LinearProgress,
    alpha,
    CssBaseline,
    CircularProgress,
    TextField,
    Grid,
    Chip,
    Avatar,
    Menu,
    MenuItem
} from '@mui/material';
import {
    ContentPaste as ContentPasteIcon,
    Analytics as AnalyticsIcon,
    ContentCopy as ContentCopyIcon,
    ChevronRight as ChevronRightIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AlarmOn as AlarmOnIcon,
    AlarmOff as AlarmOffIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { teal, blue, amber, red, green } from '@mui/material/colors';
import api from '../services/api';
import { Link } from 'react-router-dom';

// Create a theme with a darker color palette
const theme = {
    palette: {
        primary: blue,
        regular: teal[400],
        important: amber[500],
        urgent: red[500],
        background: '#1e2a38',
        surface: '#2c3e50',
        text: {
            primary: '#e0e0e0',
            secondary: '#b0b0b0'
        }
    },
    shape: {
        borderRadius: 4
    }
};

// Direct custom stylesheet injection for body and html
const injectGlobalStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            overflow-y: auto;
            background-color: ${theme.palette.background};
            color: ${theme.palette.text.primary};
        }

        * {
            box-sizing: border-box;
        }

        textarea {
            font-family: monospace;
        }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
};

// Update the CustomTextarea component for better line break visibility
const CustomTextarea = ({ value, onChange, readOnly, placeholder, minHeight = '150px' }) => (
    <Box
        component="textarea"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        sx={{
            width: '100%',
            minHeight: minHeight,
            p: 2,
            borderRadius: 1,
            background: '#1E1E1E',
            color: '#FFFFFF',
            resize: 'vertical',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            outline: 'none',
            whiteSpace: 'pre-wrap', // Ensure line breaks are preserved
            overflowWrap: 'break-word', // Allow text to wrap
            lineHeight: '1.6', // Increase line height for better readability
            '&:focus': {
                borderColor: 'primary.main',
            },
            '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
            }
        }}
    />
);

// Keep only one version of categorizeTasks
const categorizeTasks = (results) => {
    const importantUrgent = [];
    const importantNotUrgent = [];
    const notImportantUrgent = [];
    const notImportantNotUrgent = [];

    // Process results
    results.forEach(result => {
        const { task, important, urgent } = result;
        if (important === 1 && urgent === 1) {
            importantUrgent.push(task);
        } else if (important === 1 && urgent === 0) {
            importantNotUrgent.push(task);
        } else if (important === 0 && urgent === 1) {
            notImportantUrgent.push(task);
        } else {
            notImportantNotUrgent.push(task);
        }
    });

    return { importantUrgent, importantNotUrgent, notImportantUrgent, notImportantNotUrgent };
};

// Update the Quadrant component to make textboxes editable
const Quadrant = ({ title, items = [], color, borderTop, borderRight, onContentChange }) => {
    // Process the items array:
    // 1. Trim each item
    // 2. Remove duplicates
    // 3. Sort by character length (shortest first)
    // 4. Join with clear line breaks
    const processedItems = Array.isArray(items)
        ? [...new Set(items)]  // Remove duplicates using Set
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .sort((a, b) => a.length - b.length)  // Sort by character length
            .join('\n\n')  // Double line break for clarity
        : '';

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderTop: borderTop ? `1px solid ${alpha(color, 0.5)}` : 'none',
                borderRight: borderRight ? `1px solid ${alpha(color, 0.5)}` : 'none',
                p: 2
            }}
        >
            <Typography
                variant="subtitle2"
                color={color}
                gutterBottom
                sx={{ fontWeight: 'bold' }}
            >
                {title}
            </Typography>

            <CustomTextarea
                value={processedItems}
                readOnly={false} // Make textbox editable
                onChange={onContentChange} // Handle changes
                placeholder={`${title} tasks will appear here...`}
                minHeight="150px"
            />
        </Box>
    );
};

const MainApp = () => {
    // Replace the mock user with a more complete mock user
    const user = {
        name: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=random',
        role: 'user',
        id: 'mock-user-id'
    };
    const logout = () => console.log('Logout clicked');

    // Task input and lists
    const [tasksInput, setTasksInput] = useState('');
    const [importantUrgent, setImportantUrgent] = useState([]);
    const [importantNotUrgent, setImportantNotUrgent] = useState([]);
    const [notImportantUrgent, setNotImportantUrgent] = useState([]);
    const [notImportantNotUrgent, setNotImportantNotUrgent] = useState([]);

    // UI state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    // Analysis state
    const [analysisProgress, setAnalysisProgress] = useState({
        percent: 0,
        completed: 0,
        total: 0
    });

    // Add hasAnalyzed state
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    // Estimated time remaining state
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);

    // Add a state for tracking credits (simulated for now)
    const [credits, setCredits] = useState(100);

    // Add state variables for the user menu
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    // Animation states for task processing
    const [processingTasks, setProcessingTasks] = useState([]);
    const [processedTasks, setProcessedTasks] = useState([]);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [processingSpeed, setProcessingSpeed] = useState(50); // ms per task

    // Inject global styles
    useEffect(() => {
        return injectGlobalStyles();
    }, []);

    // Simulate fetching user credits
    useEffect(() => {
        // For demonstration purposes only
        const fetchCredits = async () => {
            try {
                const response = await api.get('/api/users/me');
                if (response.data && response.data.credits !== undefined) {
                    setCredits(response.data.credits);
                }
            } catch (error) {
                console.error('Error fetching user credits:', error);
                // In development, use mock credits
                setCredits(100);
            }
        };

        fetchCredits();
    }, []);

    // Analysis start timestamp
    const analysisStartTime = useRef(0);

    // Handle closing notifications
    const handleCloseNotification = () => {
        setNotification({
            ...notification,
            open: false
        });
    };

    // Update the handleAnalyzeTasks function to remove duplicates from input
    const handleAnalyzeTasks = async (e) => {
        e.preventDefault();

        // Get unique tasks from input
        const uniqueTasks = [...new Set(tasksInput.split('\n')
            .map(task => task.trim())
            .filter(task => task.length > 0)
        )];

        if (uniqueTasks.length === 0) {
            setNotification({
                open: true,
                message: 'Please enter at least one task to analyze',
                severity: 'warning'
            });
            return;
        }

        // Update input with cleaned version (optional, removes duplicates)
        setTasksInput(uniqueTasks.join('\n'));

        // Start animation preparation
        setIsAnalyzing(true);
        setProcessingTasks(uniqueTasks);
        setProcessedTasks([]);
        setCurrentTaskIndex(0);
        analysisStartTime.current = Date.now();

        // Reset previous results
        setImportantUrgent([]);
        setImportantNotUrgent([]);
        setNotImportantUrgent([]);
        setNotImportantNotUrgent([]);

        try {
            // Make API call to get analysis results
            const response = await api.post('/api/ai/analyze-tasks', { tasks: uniqueTasks });
            const { results } = response.data;

            // Create a mapping of task to category for animation
            const taskCategories = {};
            results.forEach(result => {
                const { task, important, urgent } = result;
                if (important === 1 && urgent === 1) {
                    taskCategories[task] = 'importantUrgent';
                } else if (important === 1 && urgent === 0) {
                    taskCategories[task] = 'importantNotUrgent';
                } else if (important === 0 && urgent === 1) {
                    taskCategories[task] = 'notImportantUrgent';
                } else {
                    taskCategories[task] = 'notImportantNotUrgent';
                }
            });

            // Start animation of tasks flowing to categories one by one
            let currentIndex = 0;
            const animationInterval = setInterval(() => {
                if (currentIndex >= uniqueTasks.length) {
                    clearInterval(animationInterval);
                    setIsAnalyzing(false);
                    setHasAnalyzed(true);

                    // Show completion notification
                    setNotification({
                        open: true,
                        message: 'Analysis completed successfully',
                        severity: 'success'
                    });

                    return;
                }

                const task = uniqueTasks[currentIndex];
                const category = taskCategories[task];

                // Visualize task moving to its category
                setProcessedTasks(prev => [...prev, task]);
                setCurrentTaskIndex(currentIndex);
                setAnalysisProgress({
                    percent: Math.round((currentIndex + 1) / uniqueTasks.length * 100),
                    completed: currentIndex + 1,
                    total: uniqueTasks.length
                });

                // Gradually build up each category
                if (category === 'importantUrgent') {
                    setImportantUrgent(prev => [...prev, task]);
                } else if (category === 'importantNotUrgent') {
                    setImportantNotUrgent(prev => [...prev, task]);
                } else if (category === 'notImportantUrgent') {
                    setNotImportantUrgent(prev => [...prev, task]);
                } else {
                    setNotImportantNotUrgent(prev => [...prev, task]);
                }

                currentIndex++;
            }, processingSpeed); // Use the processingSpeed state for animation speed

        } catch (error) {
            console.error('Error analyzing tasks:', error);
            setIsAnalyzing(false);
            setNotification({
                open: true,
                message: 'Error analyzing tasks. Please try again.',
                severity: 'error'
            });
        }

        // Simulate credit consumption
        setCredits(prev => Math.max(0, prev - uniqueTasks.length));
    };

    // Copy text to clipboard
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setNotification({
                open: true,
                message: 'Copied to clipboard',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            setNotification({
                open: true,
                message: 'Failed to copy to clipboard',
                severity: 'error'
            });
        }
    };

    // User menu handlers
    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleMenuClose();
    };

    // In the MainApp component, add state handlers for quadrant content changes
    const handleImportantUrgentChange = (e) => {
        setImportantUrgent(e.target.value.split('\n\n').filter(item => item.trim()));
    };

    const handleImportantNotUrgentChange = (e) => {
        setImportantNotUrgent(e.target.value.split('\n\n').filter(item => item.trim()));
    };

    const handleNotImportantUrgentChange = (e) => {
        setNotImportantUrgent(e.target.value.split('\n\n').filter(item => item.trim()));
    };

    const handleNotImportantNotUrgentChange = (e) => {
        setNotImportantNotUrgent(e.target.value.split('\n\n').filter(item => item.trim()));
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3, maxWidth: '1200px', margin: '0 auto' }}>
            <CssBaseline />

            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box> {/* Empty box to maintain layout */}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {credits !== null && (
                        <Chip
                            label={`${credits} credits`}
                            color={credits > 10 ? "primary" : "error"}
                            sx={{ mr: 2, fontWeight: 'bold' }}
                        />
                    )}
                    <Box
                        aria-controls={open ? 'profile-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleMenuClick}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                        }}
                    >
                        <Avatar
                            src={user.photoURL || user.profilePicture}
                            alt={user.name || 'User'}
                            sx={{ width: 32, height: 32, mr: 1 }}
                        >
                            {(user.name || 'U')[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                            {user.name || user.email}
                        </Typography>
                    </Box>
                    <Menu
                        id="profile-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleMenuClose}
                        MenuListProps={{
                            'aria-labelledby': 'profile-button',
                        }}
                    >
                        {user?.role === 'admin' && (
                            <MenuItem component={Link} to="/admin" onClick={handleMenuClose}>
                                Admin Panel
                            </MenuItem>
                        )}
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Task Input Form - removed title */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <form onSubmit={handleAnalyzeTasks}>
                    <Box sx={{ mb: 2 }}>
                        <CustomTextarea
                            value={tasksInput}
                            onChange={(e) => setTasksInput(e.target.value)}
                            placeholder="Enter tasks, one per line..."
                        />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isAnalyzing || tasksInput.trim() === ''}
                            sx={{ mt: 1 }}
                        >
                            {isAnalyzing ? <CircularProgress size={24} color="inherit" /> : 'Sort'}
                        </Button>

                        <Typography variant="body2" color="text.secondary">
                            Available Credits: {credits}
                        </Typography>
                    </Box>

                    {isAnalyzing && (
                        <>
                            <LinearProgress
                                variant="determinate"
                                value={analysisProgress.percent}
                                sx={{ mb: 1, mt: 2, height: 8, borderRadius: 4 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Analyzing {analysisProgress.completed} of {analysisProgress.total} items
                                </Typography>
                            </Box>
                            <Box sx={{ mb: 2, mt: 1, position: 'relative', border: '1px dashed rgba(255,255,255,0.2)', p: 2, borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">Processing tasks...</Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {processingTasks.slice(0, currentTaskIndex + 1).map((task, index) => (
                                        <Chip
                                            key={index}
                                            label={task.length > 25 ? task.substring(0, 25) + '...' : task}
                                            size="small"
                                            sx={{
                                                opacity: index < currentTaskIndex ? 0.5 : 1,
                                                animation: index === currentTaskIndex ? 'pulse 1s infinite' : 'none',
                                                '@keyframes pulse': {
                                                    '0%': { transform: 'scale(1)' },
                                                    '50%': { transform: 'scale(1.05)' },
                                                    '100%': { transform: 'scale(1)' }
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </>
                    )}
                </form>
            </Paper>

            {/* Analysis Results - removed title */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                {/* Eisenhower Matrix - removed axes labels */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateRows: 'auto auto',
                    gap: 2,
                    position: 'relative',
                }}>
                    {/* Quadrants - now with editable textboxes */}
                    <Quadrant
                        title="Important + Not Urgent"
                        items={importantNotUrgent}
                        color="#22C55E"
                        borderRight={true}
                        borderTop={true}
                        onContentChange={handleImportantNotUrgentChange}
                    />
                    <Quadrant
                        title="Important + Urgent"
                        items={importantUrgent}
                        color="#EF4444"
                        borderTop={true}
                        onContentChange={handleImportantUrgentChange}
                    />
                    <Quadrant
                        title="Not Important + Not Urgent"
                        items={notImportantNotUrgent}
                        color="#A855F7"
                        borderRight={true}
                        onContentChange={handleNotImportantNotUrgentChange}
                    />
                    <Quadrant
                        title="Not Important + Urgent"
                        items={notImportantUrgent}
                        color="#F97316"
                        onContentChange={handleNotImportantUrgentChange}
                    />
                </Box>
            </Paper>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{
                        width: '100%',
                        maxWidth: '600px',
                        backgroundColor: theme.palette.surface,
                        color: theme.palette.text.primary
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MainApp;
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Snackbar, Alert, LinearProgress,
    CssBaseline, TextField, Grid, Chip, Avatar, Menu, MenuItem, IconButton, Tooltip
} from '@mui/material';
import {
    Bolt as BoltIcon,
    Unarchive as UnarchiveIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { streamRankedTasks } from '../services/aiPrioritization';

// --- New Design System & Aesthetics ---

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const theme = {
    palette: {
        background: '#121212', // Darker, more focused background
        surface: '#1E1E1E',
        primary: '#BB86FC', // A vibrant, modern primary color
        secondary: '#03DAC6',
        text: {
            primary: '#E0E0E0',
            secondary: '#A8A8A8'
        }
    },
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    }
};

const injectGlobalStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        html, body, #root {
            background-color: ${theme.palette.background};
            color: ${theme.palette.text.primary};
            font-family: ${theme.typography.fontFamily};
            scroll-behavior: smooth;
        }
    `;
    document.head.appendChild(style);
};

// --- New Core Components ---

const TaskItem = ({ task, score, reasoning, index }) => (
    <Paper
        elevation={2}
        sx={{
            p: 2,
            mb: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `rgba(255, 255, 255, ${0.05 + (score / 100) * 0.05})`, // Subtle score indicator
            borderLeft: `3px solid ${theme.palette.primary}`,
            animation: `${fadeIn} 0.5s ease-out ${index * 0.05}s forwards`,
            opacity: 0,
        }}
    >
        <Box>
            <Typography variant="body1">{task}</Typography>
            <Typography variant="caption" color={theme.palette.text.secondary}>
                {reasoning}
            </Typography>
        </Box>
        <Tooltip title={`Impact Score: ${score}/100`} placement="left">
            <Chip label={`${score}`} sx={{ bgcolor: theme.palette.primary, color: '#000' }} />
        </Tooltip>
    </Paper>
);



// --- Main Application Component ---

const MainApp = ({ userProfile }) => {
    const [tasksInput, setTasksInput] = useState('');
    const [taskCount, setTaskCount] = useState({ total: 0, vitalFew: 0 });
    const [rankedTasks, setRankedTasks] = useState([]);
    const [vitalFew, setVitalFew] = useState([]);
    const [trivialMany, setTrivialMany] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [streamConnection, setStreamConnection] = useState(null);

    useEffect(() => {
        injectGlobalStyles();
        // Close any existing stream connection when the component unmounts
        return () => {
            if (streamConnection) {
                streamConnection.close();
            }
        };
    }, [streamConnection]);

    useEffect(() => {
        const tasks = tasksInput.split('\n').map(t => t.trim()).filter(Boolean);
        const total = tasks.length;
        const vitalFewCount = total > 0 ? Math.max(1, Math.ceil(total * 0.2)) : 0;
        setTaskCount({ total, vitalFew: vitalFewCount });
    }, [tasksInput]);

    const handleAnalyze = async () => {
        const tasks = tasksInput.split('\n').map(t => t.trim()).filter(Boolean);
        if (tasks.length === 0) {
            setNotification({ open: true, message: 'Please enter at least one task.', severity: 'warning' });
            return;
        }

        setIsAnalyzing(true);
        setHasAnalyzed(false);
        setRankedTasks([]);
        setVitalFew([]);
        setTrivialMany([]);

        // Get user priorities for AI analysis
        const userPriorities = userProfile?.getFormattedPriorities?.() ||
                              (userProfile?.lifePriorities ?
                                [userProfile.lifePriorities.priority1, userProfile.lifePriorities.priority2, userProfile.lifePriorities.priority3]
                                  .filter(Boolean)
                                  .map((p, i) => `${i + 1}. ${p}`)
                                  .join('\n') :
                                null);

        const eventSource = streamRankedTasks(tasks, userPriorities, {
            onData: (newRankedTask) => {
                setRankedTasks(prevTasks => [...prevTasks, newRankedTask]);
            },
            onError: (error) => {
                setNotification({ open: true, message: error.message, severity: 'error' });
                setIsAnalyzing(false);
            },
            onClose: () => {
                setIsAnalyzing(false);
                setHasAnalyzed(true);
                setNotification({ open: true, message: 'Analysis complete.', severity: 'success' });

                // Perform the final 80/20 split
                setRankedTasks(prevTasks => {
                    const sorted = [...prevTasks].sort((a, b) => b.impact_score - a.impact_score);
                    const vitalCount = Math.max(1, Math.ceil(sorted.length * 0.2));
                    setVitalFew(sorted.slice(0, vitalCount));
                    setTrivialMany(sorted.slice(vitalCount));
                    return sorted; // final state for rankedTasks if needed
                });

                streamConnection?.close();
            }
        });

        setStreamConnection(eventSource);
    };

    const handleUnarchive = (taskToMove) => {
        setTrivialMany(prev => prev.filter(t => t.task !== taskToMove.task));
        setVitalFew(prev => [...prev, taskToMove].sort((a, b) => b.impact_score - a.impact_score));
    };

    return (
        <Box sx={{
            maxWidth: '750px',
            margin: '0 auto',
            p: 3,
            fontFamily: theme.typography.fontFamily,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
        }}>
            <CssBaseline />

            {/* Header with Logo */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <img
                    src="/images/8020-logo.png"
                    alt="8020.best Logo"
                    style={{
                        height: '50px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                />
            </Box>
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>

            <Paper elevation={4} sx={{ p: 4, background: theme.palette.surface, borderRadius: '8px' }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Your Full Task List
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={8}
                            variant="outlined"
                            placeholder="Write a book&#10;Do dishes&#10;Taxes&#10;Plan Q3 strategy..."
                            value={tasksInput}
                            onChange={(e) => setTasksInput(e.target.value)}
                            sx={{
                                background: theme.palette.background,
                                textarea: { color: theme.palette.text.primary },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                    '&:hover fieldset': { borderColor: theme.palette.primary },
                                },
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Total Tasks: {taskCount.total} | Vital Few (20%): {taskCount.vitalFew}
                        </Typography>
                    </Grid>
                </Grid>
                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    startIcon={<BoltIcon />}
                    sx={{
                        mt: 2, py: 1.5, bgcolor: theme.palette.primary, color: '#000',
                        '&:hover': { bgcolor: theme.palette.secondary }
                    }}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Find the Vital 20%'}
                </Button>
            </Paper>

            {isAnalyzing && <LinearProgress color="primary" sx={{ mt: 4 }} />}

            {hasAnalyzed && rankedTasks.length === 0 && (
                <Typography sx={{ textAlign: 'center', mt: 4 }}>No results returned from analysis.</Typography>
            )}

            {isAnalyzing && rankedTasks.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    {rankedTasks.map((item, index) => (
                        <TaskItem key={item.task} task={item.task} score={item.impact_score} reasoning={item.reasoning} index={index} />
                    ))}
                </Box>
            )}

            {!isAnalyzing && hasAnalyzed && vitalFew.length > 0 && (
                <Box sx={{ mt: 4, animation: `${fadeIn} 0.5s ease-out` }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h6" component="h2">
                            Your 80/20 Analysis Results
                        </Typography>
                        <Typography variant="body2" color={theme.palette.text.secondary}>
                            Analyzed {vitalFew.length + trivialMany.length} tasks. Focus on the left column to achieve 80% of the results.
                        </Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={4} sx={{ p: 3, background: theme.palette.surface, height: '500px', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, color: theme.palette.primary }}>
                                    The Vital Few (20%)
                                </Typography>
                                <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mb: 2 }}>
                                    Focus on these {vitalFew.length} high-impact tasks
                                </Typography>
                                <Box sx={{ 
                                    flexGrow: 1, 
                                    overflowY: 'auto',
                                    pr: 1,
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: theme.palette.primary,
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': {
                                        background: theme.palette.secondary,
                                    }
                                }}>
                                    {vitalFew.map((item, index) => (
                                        <TaskItem key={item.task} task={item.task} score={item.impact_score} reasoning={item.reasoning} index={index} />
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Paper elevation={4} sx={{ p: 3, background: theme.palette.surface, height: '500px', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" component="h3" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                                    The Deferred 80%
                                </Typography>
                                <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mb: 2 }}>
                                    {trivialMany.length} lower-impact tasks to defer
                                </Typography>
                                <Box sx={{ 
                                    flexGrow: 1, 
                                    overflowY: 'auto',
                                    pr: 1,
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: 'rgba(255, 255, 255, 0.3)',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': {
                                        background: 'rgba(255, 255, 255, 0.5)',
                                    }
                                }}>
                                    {trivialMany.map((item, index) => (
                                        <Box key={item.task} sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            mb: 1, 
                                            p: 2,
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" color={theme.palette.text.secondary}>
                                                    {item.task}
                                                </Typography>
                                                <Typography variant="caption" color={theme.palette.text.secondary} sx={{ opacity: 0.7 }}>
                                                    {item.reasoning}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                                <Chip 
                                                    label={`${item.impact_score}`} 
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                                        color: theme.palette.text.secondary,
                                                        mr: 1
                                                    }} 
                                                />
                                                <IconButton size="small" onClick={() => handleUnarchive(item)}>
                                                    <UnarchiveIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default MainApp;
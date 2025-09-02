import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Container,
    Stack,
    Card,
    CardContent,
    CircularProgress,
    LinearProgress,
    Avatar,
    Chip,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    ArrowRight,
    CheckCircle,
    Star,
    StarBorder,
    Login,
    AccountCircle,
    Settings,
    Logout
} from '@mui/icons-material';
import { streamRankedTasks } from '../services/aiPrioritization';

const LandingPage = ({ onGetStarted }) => {
    const [priorities, setPriorities] = useState(['', '', '']);
    const [tasks, setTasks] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [rankedTasks, setRankedTasks] = useState([]);
    const [vitalFew, setVitalFew] = useState([]);
    const [trivialMany, setTrivialMany] = useState([]);
    const [hasError, setHasError] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [totalTasks, setTotalTasks] = useState(0);


    const handlePriorityChange = (index, value) => {
        const newPriorities = [...priorities];
        newPriorities[index] = value;
        setPriorities(newPriorities);
    };


    const copyTaskSection = async (tasks, sectionTitle) => {
        const taskList = tasks.map(task => `${task.impact_score} ${task.task}`).join('\n');
        const fullText = `${sectionTitle}\n${'-'.repeat(sectionTitle.length)}\n${taskList}`;
        
        try {
            await navigator.clipboard.writeText(fullText);
            // Show brief feedback
            setProgressText(`Copied ${tasks.length} tasks to clipboard!`);
            setTimeout(() => setProgressText(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const copyAllTasks = async () => {
        const allTasks = [...vitalFew, ...trivialMany];
        const sortedTasks = allTasks.sort((a, b) => b.impact_score - a.impact_score);
        
        const taskList = sortedTasks.map(task => `${task.impact_score} ${task.task}`).join('\n');
        const fullText = `80/20 PRIORITIZED TASKS\n${'='.repeat(25)}\n\n${taskList}`;
        
        try {
            await navigator.clipboard.writeText(fullText);
            setProgressText(`Copied all ${sortedTasks.length} tasks to clipboard!`);
            setTimeout(() => setProgressText(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const processTasksInChunks = async (taskArray, userPriorities, chunkSize, totalTaskCount) => {
        let processedTasks = [];
        const chunks = [];
        
        // Split tasks into chunks
        for (let i = 0; i < taskArray.length; i += chunkSize) {
            chunks.push(taskArray.slice(i, i + chunkSize));
        }
        
        console.log(`Processing ${taskArray.length} tasks in ${chunks.length} chunks of ${chunkSize}`);
        
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const chunkProgress = 20 + (chunkIndex / chunks.length) * 60;
            
            setProgress(chunkProgress);
            setProgressText(`Processing chunk ${chunkIndex + 1} of ${chunks.length} (${chunk.length} tasks)...`);
            
            try {
                await new Promise((resolve, reject) => {
                    streamRankedTasks(chunk, userPriorities, {
                        onData: (newRankedTask) => {
                            console.log('Received task data:', newRankedTask);
                            processedTasks.push(newRankedTask);
                            setRankedTasks(prevTasks => {
                                const updated = [...prevTasks, newRankedTask];
                                const overallProgress = 20 + (updated.length / totalTaskCount) * 60;
                                setProgress(overallProgress);
                                setProgressText(`Analyzed ${updated.length} of ${totalTaskCount} tasks: "${newRankedTask.task}"`);
                                return updated;
                            });
                        },
                        onError: (error) => {
                            console.error('Chunk analysis error:', error);
                            reject(error);
                        },
                        onClose: () => {
                            console.log(`Chunk ${chunkIndex + 1} completed`);
                            resolve();
                        }
                    });
                });
                
                // Small delay between chunks to avoid overwhelming the API
                if (chunkIndex < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
                setIsAnalyzing(false);
                setHasError(true);
                return;
            }
        }
        
        // All chunks processed successfully
        setProgress(80);
        setProgressText('Categorizing your tasks...');
        
        // Perform the final 80/20 split
        const allTasks = [...processedTasks];
        console.log(`Total processed tasks: ${allTasks.length} out of ${totalTaskCount} submitted`);
        
        if (allTasks.length < totalTaskCount) {
            console.error(`WARNING: Only processed ${allTasks.length} tasks out of ${totalTaskCount} submitted!`);
            console.log('Missing tasks:', taskArray.filter(t => !allTasks.some(pt => pt.task === t)));
        }
        
        const sortedTasks = allTasks.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));
        
        const splitPoint = Math.ceil(sortedTasks.length * 0.2);
        const vitalFewTasks = sortedTasks.slice(0, splitPoint);
        const trivialManyTasks = sortedTasks.slice(splitPoint);
        
        setVitalFew(vitalFewTasks);
        setTrivialMany(trivialManyTasks);
        
        setProgress(100);
        setProgressText(`Analysis complete! ${vitalFewTasks.length} vital few, ${trivialManyTasks.length} trivial many (${allTasks.length} total)`);
        setIsAnalyzing(false);
    };

    const handleAnalyze = async () => {
        if (!priorities.some(p => p.trim()) || !tasks.trim()) {
            alert('Please enter both your priorities and tasks');
            return;
        }

        // Input validation
        const taskArray = tasks.split('\n').filter(task => task.trim());
        const taskCount = taskArray.length;
        const totalChars = tasks.length;
        
        // Set limits
        const MAX_TASKS = 100;
        const MAX_CHARS = 100000;
        const CHUNK_SIZE = 25; // Process 25 tasks at a time for better reliability
        
        if (taskCount > MAX_TASKS) {
            alert(`Too many tasks! Please limit to ${MAX_TASKS} tasks or less. You have ${taskCount} tasks.`);
            return;
        }
        
        if (totalChars > MAX_CHARS) {
            alert(`Task list too long! Please limit to ${MAX_CHARS} characters or less. You have ${totalChars} characters.`);
            return;
        }


        
        setIsAnalyzing(true);
        setShowResults(true);
        setRankedTasks([]);
        setVitalFew([]);
        setTrivialMany([]);
        setHasError(false);
        setProgress(0);
        setTotalTasks(taskCount);
        setProgressText(`Initializing analysis for ${taskCount} tasks...`);
        
        try {
            // No authentication required for now

            setProgress(10);
            setProgressText('Saving your priorities...');

            // Skip saving priorities for now (no authentication)

            setProgress(20);
            setProgressText('Starting AI analysis...');

            // Convert tasks string to array
            const userPriorities = priorities.filter(p => p.trim()).map((p, i) => `${i + 1}. ${p}`).join('\n');
            
            // Process tasks in chunks
            await processTasksInChunks(taskArray, userPriorities, CHUNK_SIZE, taskCount);
            
            // Analysis complete
        } catch (error) {
            console.error('Error saving priorities:', error);
            setHasError(true);
            setIsAnalyzing(false);
            setProgress(0);
            setProgressText('');
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            maxHeight: '100vh',
            overflow: 'auto',
            background: '#000',
            color: 'white',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            <Container maxWidth="md" sx={{ py: 6 }}>
                
                {/* Hero */}
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            mb: 2,
                            background: 'linear-gradient(45deg, #FFF 30%, #8B5CF6 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: { xs: '2rem', md: '3rem' }
                        }}
                    >
                        Focus on what matters
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ opacity: 0.7, fontSize: '0.9rem', mb: 4 }}
                    >
                        AI finds your high-impact tasks
                    </Typography>
                    
                </Box>

                {/* Product Section */}
                <Box sx={{ mb: 6 }}>
                    <Stack spacing={3}>
                        {/* Step 1: Priorities */}
                        <Card sx={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: 3,
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #333', backgroundColor: '#111' }}>
                                <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#8B5CF6' }}>
                                    🎯 Your Top 3 Life Priorities
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5 }}>
                                    What matters most to you right now?
                                </Typography>
                            </Box>
                            <CardContent sx={{ p: 2 }}>
                                <Stack spacing={1.5}>
                                    {priorities.map((priority, index) => (
                                        <TextField
                                            key={index}
                                            placeholder={`Priority ${index + 1} (e.g., "Financial freedom", "Health", "Family")`}
                                            value={priority}
                                            onChange={(e) => handlePriorityChange(index, e.target.value)}
                                            size="small"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#222',
                                                    color: 'white',
                                                    fontSize: '0.8rem',
                                                    borderRadius: '8px',
                                                    '& fieldset': {
                                                        borderColor: '#444'
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: '#8B5CF6'
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#8B5CF6'
                                                    }
                                                },
                                                '& .MuiInputBase-input::placeholder': {
                                                    color: '#666',
                                                    fontSize: '0.75rem'
                                                }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Step 2: Tasks */}
                        <Card sx={{
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: 3,
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #333', backgroundColor: '#111' }}>
                                <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#8B5CF6' }}>
                                    📝 Your Tasks
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 0.5 }}>
                                    List everything on your mind, one per line
                                </Typography>
                            </Box>
                            <CardContent sx={{ p: 2 }}>
                                <TextField
                                    placeholder="Write your task here... ⏎
Clean inbox
Call mom
Book flight
Plan project kickoff
Review budget"
                                    multiline
                                    rows={6}
                                    value={tasks}
                                    onChange={(e) => setTasks(e.target.value)}
                                    fullWidth
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: '#222',
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            borderRadius: '8px',
                                            lineHeight: 1.5,
                                            '& fieldset': {
                                                borderColor: '#444'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: '#8B5CF6'
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#8B5CF6'
                                            }
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                            color: '#666',
                                            fontSize: '0.75rem',
                                            whiteSpace: 'pre-line'
                                        }
                                    }}
                                />
                                {/* Character and Task Counter */}
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        mt: 1, 
                                        display: 'block', 
                                        color: tasks.length > 100000 || tasks.split('\n').filter(t => t.trim()).length > 100 ? '#f44336' : '#666',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {tasks.split('\n').filter(t => t.trim()).length} tasks • {tasks.length} characters 
                                    (limit: 100 tasks, 100,000 characters)
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* Analyze Button */}
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleAnalyze}
                                endIcon={<ArrowRight />}
                                disabled={isAnalyzing}
                                sx={{
                                    backgroundColor: '#8B5CF6',
                                    '&:hover': {
                                        backgroundColor: '#7C3AED'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#444',
                                        color: '#999'
                                    },
                                    fontSize: '1rem',
                                    py: 2,
                                    px: 6,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                                }}
                            >
                                {isAnalyzing ? '⚡ Analyzing...' : '🚀 Analyze with AI'}
                            </Button>
                            
                        </Box>

                        {/* Results */}
                        {showResults && (
                            <Card sx={{
                                backgroundColor: '#111',
                                border: '1px solid #8B5CF6',
                                borderRadius: 2,
                                overflow: 'hidden'
                            }}>
                                <CardContent sx={{ p: 0 }}>
                                    {/* Header */}
                                    <Box sx={{ p: 3, borderBottom: '1px solid #333' }}>
                                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#8B5CF6', mb: 1 }}>
                                            🎯 80/20 Analysis Results
                                        </Typography>
                                        {!isAnalyzing && !hasError && vitalFew.length > 0 && (
                                            <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>
                                                {vitalFew.length} vital tasks • {trivialMany.length} trivial tasks • Click any section to copy
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    {/* Progress */}
                                    {isAnalyzing && (
                                        <Box sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography sx={{ fontSize: '0.85rem', color: '#8B5CF6', fontWeight: 600 }}>
                                                    {progressText}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                                    {Math.round(progress)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={progress} 
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    backgroundColor: '#333',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: '#8B5CF6',
                                                        borderRadius: 3
                                                    }
                                                }}
                                            />
                                        </Box>
                                    )}
                                    
                                    {/* Error State */}
                                    {hasError && (
                                        <Box sx={{ p: 3 }}>
                                            <Typography sx={{ fontSize: '0.85rem', color: '#ff6b6b' }}>
                                                Analysis failed. Please try again.
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    {/* Results */}
                                    {!isAnalyzing && !hasError && vitalFew.length > 0 && (
                                        <>
                                            {/* Copy All Button */}
                                            <Box sx={{ p: 2, borderBottom: '1px solid #333', backgroundColor: '#0a0a0a' }}>
                                                <Button
                                                    onClick={() => copyAllTasks()}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                        borderColor: '#8B5CF6',
                                                        color: '#8B5CF6',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            borderColor: '#8B5CF6',
                                                            backgroundColor: 'rgba(139, 92, 246, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    📋 Copy All Tasks (Sorted)
                                                </Button>
                                            </Box>

                                            {/* Vital Few */}
                                            <Box 
                                                onClick={() => copyTaskSection(vitalFew, 'VITAL FEW (Top 20%)')}
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:hover': { backgroundColor: '#1a1a1a' },
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
                                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#8B5CF6', mb: 0.5 }}>
                                                        🔥 VITAL FEW ({vitalFew.length})
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>
                                                        Top 20% • High impact tasks
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ p: 2 }}>
                                                    {vitalFew.map((task, index) => (
                                                        <Box key={index} sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'flex-start',
                                                            mb: 1,
                                                            fontSize: '0.8rem',
                                                            lineHeight: 1.4
                                                        }}>
                                                            <Typography sx={{ 
                                                                minWidth: '32px',
                                                                fontWeight: 700,
                                                                color: '#8B5CF6',
                                                                fontSize: '0.75rem'
                                                            }}>
                                                                {task.impact_score}
                                                            </Typography>
                                                            <Typography sx={{ 
                                                                color: 'white',
                                                                fontSize: '0.8rem',
                                                                ml: 1
                                                            }}>
                                                                {task.task}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                            
                                            {/* Trivial Many */}
                                            {trivialMany.length > 0 && (
                                                <Box 
                                                    onClick={() => copyTaskSection(trivialMany, 'TRIVIAL MANY (Bottom 80%)')}
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        '&:hover': { backgroundColor: '#1a1a1a' },
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
                                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#666', mb: 0.5 }}>
                                                            📝 TRIVIAL MANY ({trivialMany.length})
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.7rem', color: '#555' }}>
                                                            Bottom 80% • Lower impact tasks
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                                                        {trivialMany.map((task, index) => (
                                                            <Box key={index} sx={{ 
                                                                display: 'flex', 
                                                                alignItems: 'flex-start',
                                                                mb: 0.8,
                                                                fontSize: '0.75rem',
                                                                lineHeight: 1.3
                                                            }}>
                                                                <Typography sx={{ 
                                                                    minWidth: '28px',
                                                                    fontWeight: 600,
                                                                    color: '#666',
                                                                    fontSize: '0.7rem'
                                                                }}>
                                                                    {task.impact_score}
                                                                </Typography>
                                                                <Typography sx={{ 
                                                                    color: '#999',
                                                                    fontSize: '0.75rem',
                                                                    ml: 1
                                                                }}>
                                                                    {task.task}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                    
                                    {!isAnalyzing && !hasError && vitalFew.length === 0 && rankedTasks.length === 0 && (
                                        <Box sx={{ p: 3 }}>
                                            <Typography sx={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                                                Click analyze to see your 80/20 breakdown
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};

export default LandingPage;
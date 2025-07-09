import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Container,
    Paper,
    Stack,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Alert,
    LinearProgress
} from '@mui/material';
import { Psychology, TrendingUp, CheckCircle } from '@mui/icons-material';

const Onboarding = ({ onComplete }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [priorities, setPriorities] = useState({
        priority1: '',
        priority2: '',
        priority3: ''
    });
    const [loading, setLoading] = useState(false);

    const steps = [
        {
            label: 'Welcome to 8020.best',
            description: 'Set up your personal productivity system',
        },
        {
            label: 'Define Your Life Priorities',
            description: 'Tell us what matters most to you',
        },
        {
            label: 'You\'re Ready!',
            description: 'Start analyzing your tasks with AI',
        },
    ];

    const handleNext = () => {
        if (activeStep === 1) {
            // Validate priorities
            if (!priorities.priority1.trim()) {
                alert('Please set at least your top priority');
                return;
            }
            handleComplete();
        } else {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Here you would save the priorities to your backend
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            onComplete(priorities);
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriorityChange = (field, value) => {
        setPriorities(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ mb: 3 }}>
              <img
                src="/images/8020-logo.png"
                alt="8020.best Logo"
                style={{
                  height: '60px',
                  marginBottom: '10px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              Welcome to 8020.best!
            </Typography>
                        <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, maxWidth: '600px', mx: 'auto' }}>
                            You're about to transform how you handle your tasks. Our AI will analyze your to-do list
                            based on YOUR personal priorities, helping you focus on what truly matters.
                        </Typography>
                        <Alert severity="info" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
                            <strong>The 80/20 Principle:</strong> 20% of your tasks deliver 80% of your results.
                            Let's find that critical 20%.
                        </Alert>
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ py: 4 }}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
                            What are your top 3 life priorities?
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, textAlign: 'center' }}>
                            These will guide our AI analysis. Be specific about what matters most to you right now.
                        </Typography>

                        <Stack spacing={3} sx={{ maxWidth: '600px', mx: 'auto' }}>
                            <Box>
                                <Typography variant="h6" sx={{ mb: 1, color: '#4CAF50' }}>
                                    🥇 Priority #1 (Most Important)
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="e.g., Build a successful business, Get healthy, Spend time with family"
                                    value={priorities.priority1}
                                    onChange={(e) => handlePriorityChange('priority1', e.target.value)}
                                    multiline
                                    rows={2}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                        }
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="h6" sx={{ mb: 1, color: '#2196F3' }}>
                                    🥈 Priority #2
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="e.g., Learn new skills, Pay off debt, Travel more"
                                    value={priorities.priority2}
                                    onChange={(e) => handlePriorityChange('priority2', e.target.value)}
                                    multiline
                                    rows={2}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                        }
                                    }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="h6" sx={{ mb: 1, color: '#FF9800' }}>
                                    🥉 Priority #3
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="e.g., Improve relationships, Create passive income, Write a book"
                                    value={priorities.priority3}
                                    onChange={(e) => handlePriorityChange('priority3', e.target.value)}
                                    multiline
                                    rows={2}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                        }
                                    }}
                                />
                            </Box>
                        </Stack>

                        <Alert severity="success" sx={{ mt: 4, maxWidth: '600px', mx: 'auto' }}>
                            <strong>Pro Tip:</strong> You can always update these priorities later in your profile settings.
                        </Alert>
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 3 }} />
                        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
                            You're All Set!
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, maxWidth: '600px', mx: 'auto' }}>
                            Your priorities have been saved. Now you can paste your task list and get AI-powered
                            analysis that's personalized to what matters most to you.
                        </Typography>

                        <Box sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Your Priorities:</Typography>
                            <Stack spacing={1}>
                                {priorities.priority1 && (
                                    <Typography variant="body2" sx={{ textAlign: 'left' }}>
                                        🥇 {priorities.priority1}
                                    </Typography>
                                )}
                                {priorities.priority2 && (
                                    <Typography variant="body2" sx={{ textAlign: 'left' }}>
                                        🥈 {priorities.priority2}
                                    </Typography>
                                )}
                                {priorities.priority3 && (
                                    <Typography variant="body2" sx={{ textAlign: 'left' }}>
                                        🥉 {priorities.priority3}
                                    </Typography>
                                )}
                            </Stack>
                        </Box>
                    </Box>
                );

            default:
                return 'Unknown step';
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 4
        }}>
            <Container maxWidth="md">
                <Paper sx={{
                    p: 4,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <Stepper activeStep={activeStep} orientation="vertical">
                        {steps.map((step, index) => (
                            <Step key={step.label}>
                                <StepLabel>
                                    <Typography variant="h6" sx={{ color: 'white' }}>
                                        {step.label}
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                                        {step.description}
                                    </Typography>

                                    {getStepContent(index)}

                                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                                        {loading && <LinearProgress sx={{ mb: 2 }} />}
                                        <Button
                                            variant="contained"
                                            onClick={handleNext}
                                            disabled={loading}
                                            sx={{
                                                backgroundColor: '#4CAF50',
                                                '&:hover': {
                                                    backgroundColor: '#45a049',
                                                },
                                                px: 4,
                                                py: 1.5
                                            }}
                                        >
                                            {index === steps.length - 1 ? 'Start Using 8020.best' : 'Continue'}
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>
                        ))}
                    </Stepper>
                </Paper>
            </Container>
        </Box>
    );
};

export default Onboarding;
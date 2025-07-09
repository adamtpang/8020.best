import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Alert
} from '@mui/material';
import {
    Psychology as PsychologyIcon,
    BarChart as BarChartIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { analyzeTasks, getAnalysisMetrics } from '../services/aiPrioritization';

const EnhancedAnalysisDemo = () => {
    const [demoResults, setDemoResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    const sampleTasks = [
        "Learn Python programming",
        "Pay credit card bill due tomorrow",
        "Check Instagram",
        "Doctor called about test results",
        "https://interesting-article.com/ai-productivity",
        "Brainstorm ideas for side project",
        "Schedule dentist appointment",
        "Maybe watch Netflix later",
        "Submit quarterly tax report by Friday",
        "Read book on machine learning"
    ];

    const runDemo = async () => {
        setIsAnalyzing(true);
        setProgress(0);

        try {
            // Simulate progress tracking
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const { results, stats } = await analyzeTasks(sampleTasks);

            clearInterval(progressInterval);
            setProgress(100);

            const metrics = getAnalysisMetrics(results);

            setDemoResults({
                results,
                stats,
                metrics,
                tasks: sampleTasks
            });

        } catch (error) {
            console.error('Demo analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.6) return 'warning';
        return 'error';
    };

    const getConfidenceLabel = (confidence) => {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        return 'Low';
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom align="center">
                Enhanced AI Task Analysis Demo
            </Typography>

            <Typography variant="body1" color="text.secondary" align="center" paragraph>
                Showcasing improved AI judgment with confidence scoring, reasoning, and ensemble methods
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={runDemo}
                    disabled={isAnalyzing}
                    startIcon={<PsychologyIcon />}
                    sx={{ px: 4, py: 1.5 }}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Run Enhanced Analysis Demo'}
                </Button>
            </Box>

            {isAnalyzing && (
                <Box sx={{ mb: 3 }}>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        Processing with multiple AI methods... {progress}%
                    </Typography>
                </Box>
            )}

            {demoResults && (
                <>
                    {/* Overview Stats */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Analysis Quality Metrics
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>
                                            Average Confidence
                                        </Typography>
                                        <Typography variant="h4" component="div" color="primary">
                                            {Math.round(demoResults.metrics.average_confidence * 100)}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>
                                            High Confidence
                                        </Typography>
                                        <Typography variant="h4" component="div" color="success.main">
                                            {Math.round(demoResults.metrics.high_confidence_percentage)}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>
                                            Important Tasks
                                        </Typography>
                                        <Typography variant="h4" component="div" color="warning.main">
                                            {Math.round(demoResults.metrics.important_percentage)}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>
                                            Tasks with Reasoning
                                        </Typography>
                                        <Typography variant="h4" component="div" color="info.main">
                                            {demoResults.metrics.has_reasoning}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Detailed Results */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Detailed Analysis Results
                        </Typography>

                        <List>
                            {Object.entries(demoResults.results).map(([task, result], index) => (
                                <React.Fragment key={task}>
                                    <ListItem sx={{ py: 2 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Typography variant="body1">
                                                        {task}
                                                    </Typography>
                                                    <Chip
                                                        label={`${getConfidenceLabel(result.confidence)} (${Math.round(result.confidence * 100)}%)`}
                                                        color={getConfidenceColor(result.confidence)}
                                                        size="small"
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                        <Chip
                                                            label={result.important ? "Important" : "Not Important"}
                                                            color={result.important ? "warning" : "default"}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            label={result.urgent ? "Urgent" : "Not Urgent"}
                                                            color={result.urgent ? "error" : "default"}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        {result.methods_used && (
                                                            <Chip
                                                                label={`Methods: ${result.methods_used}`}
                                                                color="info"
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                    {result.reasoning && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            <strong>Reasoning:</strong> {result.reasoning}
                                                        </Typography>
                                                    )}
                                                    {result.ensemble_score && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            <strong>Ensemble Scores:</strong> Important: {result.ensemble_score.importance_raw?.toFixed(2)},
                                                            Urgent: {result.ensemble_score.urgency_raw?.toFixed(2)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < Object.keys(demoResults.results).length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>

                    {/* Improvements Summary */}
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Key Improvements Implemented
                        </Typography>
                        <List dense>
                            <ListItem>
                                <ListItemText primary="✅ Better AI Models: Switched from Llama-8B to GPT-4o-mini with 300+ tokens for reasoning" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="✅ Enhanced Prompts: Added examples, context, and structured reasoning guidelines" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="✅ User Context: Includes time, goals, and personal preferences for better decisions" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="✅ Confidence Scoring: Every decision includes confidence level (0.1-1.0)" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="✅ Ensemble Methods: Combines AI, rule-based, and keyword analysis for better accuracy" />
                            </ListItem>
                        </List>
                    </Alert>
                </>
            )}
        </Box>
    );
};

export default EnhancedAnalysisDemo;
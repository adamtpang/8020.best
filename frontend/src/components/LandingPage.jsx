import React, { useState } from 'react';
import { streamRankedTasks } from '../services/aiPrioritization';
import { useAuth } from '../contexts/AuthContext';
import CleanLoginDialog from './auth/CleanLoginDialog';
import UserMenu from './auth/UserMenu';
import { Sparkles, Target, Clock, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
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
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    const { user, isAuthenticated } = useAuth();

    const handlePriorityChange = (index, value) => {
        const newPriorities = [...priorities];
        newPriorities[index] = value;
        setPriorities(newPriorities);
    };

    const copyTaskSection = async (tasks, sectionTitle) => {
        const isHighValue = sectionTitle.includes('DO THESE');

        if (isHighValue) {
            const taskList = tasks.map((task, index) => `${index + 1}. ${task.task}`).join('\n');
            const fullText = `${sectionTitle}\n${'='.repeat(sectionTitle.length)}\n\n${taskList}\n\n✅ Focus on these first - they drive 80% of your results!`;

            try {
                await navigator.clipboard.writeText(fullText);
                setProgressText(`✅ Copied ${tasks.length} high-impact tasks! Paste into your daily planner.`);
                setTimeout(() => setProgressText(''), 3000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        } else {
            const taskList = tasks.map(task => `• ${task.task}`).join('\n');
            const fullText = `${sectionTitle}\n${'='.repeat(sectionTitle.length)}\n\n${taskList}\n\n📁 Archive these in your "someday/maybe" list for later review.`;

            try {
                await navigator.clipboard.writeText(fullText);
                setProgressText(`📁 Copied ${tasks.length} low-impact tasks to archive! Clear them from your mind.`);
                setTimeout(() => setProgressText(''), 3000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    const copyAllTasks = async () => {
        const vitalList = vitalFew.map((task, index) => `${index + 1}. ${task.task}`).join('\n');
        const trivialList = trivialMany.map(task => `• ${task.task}`).join('\n');

        const fullText = `80/20 TASK ANALYSIS RESULTS\n${'='.repeat(30)}\n\n🔥 DO THESE FIRST (${vitalFew.length} tasks)\n${'-'.repeat(40)}\n${vitalList}\n\n✅ Focus on these - they drive 80% of your results!\n\n\n🗂️ ARCHIVE THESE (${trivialMany.length} tasks)\n${'-'.repeat(40)}\n${trivialList}\n\n📁 Move these to your "someday/maybe" list.`;

        try {
            await navigator.clipboard.writeText(fullText);
            setProgressText(`📋 Copied complete 80/20 breakdown! Paste into your task manager.`);
            setTimeout(() => setProgressText(''), 3000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const processTasksOneByOne = async (taskArray, userPriorities, totalTaskCount) => {
        let processedTasks = [];

        console.log(`Processing ${taskArray.length} tasks one by one`);

        try {
            await new Promise((resolve, reject) => {
                streamRankedTasks(taskArray, userPriorities, {
                    onData: (newRankedTask) => {
                        console.log('Received task data:', newRankedTask);
                        processedTasks.push(newRankedTask);
                        setRankedTasks(prevTasks => {
                            const updated = [...prevTasks, newRankedTask];
                            const overallProgress = 20 + (updated.length / totalTaskCount) * 60;
                            setProgress(overallProgress);

                            const taskPreview = newRankedTask.task.length > 50
                                ? newRankedTask.task.substring(0, 50) + '...'
                                : newRankedTask.task;
                            setProgressText(`✓ Rated "${taskPreview}" → Impact Score: ${newRankedTask.impact_score} (${updated.length}/${totalTaskCount})`);
                            return updated;
                        });
                    },
                    onError: (error) => {
                        console.error('Analysis error:', error);
                        reject(error);
                    },
                    onClose: () => {
                        console.log('Analysis completed');
                        resolve();
                    }
                });
            });

            setProgress(80);
            setProgressText('Categorizing your tasks by impact...');

            const allTasks = [...processedTasks];
            const sortedTasks = allTasks.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));

            const splitPoint = Math.ceil(sortedTasks.length * 0.2);
            const vitalFewTasks = sortedTasks.slice(0, splitPoint);
            const trivialManyTasks = sortedTasks.slice(splitPoint);

            setVitalFew(vitalFewTasks);
            setTrivialMany(trivialManyTasks);

            setProgress(100);
            setProgressText(`Analysis complete! ${vitalFewTasks.length} vital few, ${trivialManyTasks.length} trivial many`);
            setIsAnalyzing(false);

        } catch (error) {
            console.error('Error processing tasks:', error);
            setIsAnalyzing(false);
            setHasError(true);
        }
    };

    const handleAnalyze = async () => {
        if (!priorities.some(p => p.trim()) || !tasks.trim()) {
            alert('Please enter both your priorities and tasks');
            return;
        }

        const taskArray = tasks.split('\n').filter(task => task.trim());
        const taskCount = taskArray.length;
        const totalChars = tasks.length;

        const MAX_TASKS = 1000;
        const MAX_CHARS = 1000000;

        if (taskCount > MAX_TASKS) {
            alert(`Too many tasks! Please limit to ${MAX_TASKS} tasks or less.`);
            return;
        }

        if (totalChars > MAX_CHARS) {
            alert(`Task list too long! Please limit to ${MAX_CHARS} characters or less.`);
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
            setProgress(10);
            setProgressText('Saving your priorities...');
            setProgress(20);
            setProgressText('Starting AI analysis...');

            const userPriorities = priorities.filter(p => p.trim()).map((p, i) => `${i + 1}. ${p}`).join('\n');

            await processTasksOneByOne(taskArray, userPriorities, taskCount);

        } catch (error) {
            console.error('Error during analysis:', error);
            setHasError(true);
            setIsAnalyzing(false);
            setProgress(0);
            setProgressText('');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">8020.best</h1>
                                <p className="text-sm text-muted-foreground">AI-Powered Task Prioritization</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => window.open('https://buy.stripe.com/bIYeXH6aL8EG18c5ko', '_blank')}
                                        className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {user?.credits || 0} credits
                                    </button>
                                    <UserMenu />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                                        <TrendingUp className="w-4 h-4" />
                                        Beta
                                    </div>
                                    <button
                                        onClick={() => setShowLoginDialog(true)}
                                        className="border border-border/50 bg-transparent text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-6xl font-bold text-balance mb-4 text-foreground">
                        Find your <span className="text-white">vital few</span> tasks
                    </h2>
                    <p className="text-lg text-muted-foreground text-balance max-w-xl mx-auto mb-8">
                        AI identifies the 20% of tasks that create 80% of your results
                    </p>
                </div>

                {/* Main Interface */}
                <div className="max-w-4xl mx-auto">
                    {showResults && vitalFew.length > 0 ? (
                        /* Results Display */
                        <div className="p-8 bg-card border border-border/50 rounded-lg">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">80/20 Analysis Results</h3>
                                        <p className="text-sm text-muted-foreground">Your prioritized task breakdown</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {setShowResults(false); setVitalFew([]); setTrivialMany([]);}}
                                    className="border border-border/50 bg-transparent px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-white"
                                >
                                    Start Over
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Top 20% Section */}
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-primary">🔥 Top 20% - DO THESE FIRST ({vitalFew.length} tasks)</h4>
                                        <button
                                            onClick={() => copyTaskSection(vitalFew, '🔥 DO THESE FIRST (Top 20%)')}
                                            className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="space-y-2 font-mono text-sm text-black">
                                            {vitalFew.map((task, index) => (
                                                <div key={index}>
                                                    {index + 1}. {task.task}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom 80% Section */}
                                <div className="bg-muted/20 border border-border/50 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-muted-foreground">📁 Bottom 80% - ARCHIVE THESE ({trivialMany.length} tasks)</h4>
                                        <button
                                            onClick={() => copyTaskSection(trivialMany, '📁 ARCHIVE THESE (Bottom 80%)')}
                                            className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="space-y-2 font-mono text-sm text-black">
                                            {trivialMany.map((task, index) => (
                                                <div key={index}>
                                                    • {task.task}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-primary">Pro tip:</strong> Focus on completing the top 20% tasks first.
                                    Archive the bottom 80% to your "someday/maybe" list to clear mental clutter.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Life Priorities Input */}
                            <div className="p-6 bg-card border border-border/50 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 text-white">What matters most to you?</h3>
                                <div className="space-y-3">
                                    {priorities.map((priority, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            placeholder={index === 0 ? `Priority 1: e.g., "Financial freedom"` : index === 1 ? `Priority 2: e.g., "Health & fitness"` : `Priority 3: e.g., "Family relationships"`}
                                            value={priority}
                                            onChange={(e) => handlePriorityChange(index, e.target.value)}
                                            className="w-full bg-white text-black border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Todo List Input */}
                            <div className="p-6 bg-card border border-border/50 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 text-white">Your tasks (one per line)</h3>
                                <textarea
                                    placeholder="Finish quarterly report&#10;Call mom&#10;Update website&#10;Plan team meeting&#10;Buy groceries&#10;Review budget&#10;Schedule appointment&#10;Prepare presentation"
                                    rows={8}
                                    value={tasks}
                                    onChange={(e) => setTasks(e.target.value)}
                                    className="w-full bg-white text-black border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    {(!showResults || vitalFew.length === 0) && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleAnalyze}
                                disabled={!priorities.some(p => p.trim()) || !tasks.trim() || isAnalyzing}
                                className="px-8 py-3 text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2 inline-block" />
                                        Analyzing your priorities...
                                    </>
                                ) : (
                                    <>
                                        Find My Vital Few
                                        <ArrowRight className="w-4 h-4 ml-2 inline" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                </div>

                {/* Progress Display for Analysis */}
                {isAnalyzing && showResults && (
                    <div className="bg-card rounded-lg border border-primary/50 p-6 mt-8">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-primary">{progressText}</p>
                            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg mt-8">
                        <p className="text-destructive text-sm">Analysis failed. Please try again.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 mt-24">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-sm text-muted-foreground">
                        <p>Built with AI to help you focus on what matters most.</p>
                    </div>
                </div>
            </footer>

            {/* Login Dialog */}
            <CleanLoginDialog
                open={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
            />
        </div>
    );
};

export default LandingPage;
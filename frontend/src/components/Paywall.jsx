import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Crown } from 'lucide-react';
import axiosInstance from '../services/axiosInstance';

/**
 * Paywall component
 * Shows plan options with Stripe Payment Links
 */
const Paywall = ({ user, onClose }) => {
    const [plans, setPlans] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await axiosInstance.get('/api/stripe/plans');
            if (response.data.success) {
                setPlans(response.data.plans);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            // Fallback to placeholder links
            setPlans({
                light: {
                    name: 'Light',
                    price: 5,
                    monthlyLimit: 300,
                    features: ['300 runs per month', 'Priority support', 'Advanced analysis'],
                    stripeLink: 'https://buy.stripe.com/REPLACE_LIGHT'
                },
                pro: {
                    name: 'Pro',
                    price: 10,
                    monthlyLimit: 1000,
                    features: ['1000 runs per month', 'Priority support', 'Advanced analysis', 'Export to Notion/Calendar'],
                    stripeLink: 'https://buy.stripe.com/REPLACE_PRO'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = (plan, stripeLink) => {
        // Fire telemetry
        console.log(`[Telemetry] click_upgrade_${plan.toLowerCase()}`);

        // Open Stripe Payment Link
        window.open(stripeLink, '_blank');
    };

    if (loading) {
        return (
            <div className="p-8 bg-card border border-border/50 rounded-lg text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading pricing...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-card border border-border/50 rounded-lg">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Unlock More Clarity Runs</h2>
                <p className="text-muted-foreground">
                    {user
                        ? `You've reached your ${user.plan} plan limit`
                        : "You've used all your free runs for today"}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Light Plan */}
                {plans?.light && (
                    <div className="bg-background border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-white">Light</h3>
                        </div>
                        <div className="mb-4">
                            <span className="text-3xl font-bold text-white">${plans.light.price}</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                            {plans.light.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="text-primary">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleUpgrade('light', plans.light.stripeLink)}
                            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Upgrade to Light
                        </button>
                    </div>
                )}

                {/* Pro Plan */}
                {plans?.pro && (
                    <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 relative">
                        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                            Popular
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <Crown className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-white">Pro</h3>
                        </div>
                        <div className="mb-4">
                            <span className="text-3xl font-bold text-white">${plans.pro.price}</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                            {plans.pro.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                                    <span className="text-primary">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleUpgrade('pro', plans.pro.stripeLink)}
                            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center">
                {!user && (
                    <p className="text-sm text-muted-foreground mb-4">
                        Already have an account?{' '}
                        <button
                            onClick={onClose}
                            className="text-primary hover:underline"
                        >
                            Sign in
                        </button>
                    </p>
                )}
                <p className="text-xs text-muted-foreground">
                    After checkout, your account will be automatically upgraded with more runs.
                </p>
            </div>
        </div>
    );
};

export default Paywall;
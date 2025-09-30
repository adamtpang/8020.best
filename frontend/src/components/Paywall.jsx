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
                paid: {
                    name: 'Pro',
                    price: 10,
                    monthlyLimit: 1000,
                    features: ['1000 runs per month', 'Priority support', 'Advanced analysis'],
                    stripeLink: 'https://buy.stripe.com/fZu4gz0wygNffYQd8RaMU09'
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
                <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
                <p className="text-muted-foreground">
                    {user
                        ? `You've used your 10 free runs this month`
                        : "You've used all 10 free runs this month"}
                </p>
            </div>

            <div className="max-w-md mx-auto">
                {/* Paid Plan */}
                {plans?.paid && (
                    <div className="bg-primary/10 border-2 border-primary rounded-lg p-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Crown className="w-6 h-6 text-primary" />
                            <h3 className="text-2xl font-semibold text-white">{plans.paid.name}</h3>
                        </div>
                        <div className="text-center mb-6">
                            <span className="text-5xl font-bold text-white">${plans.paid.price}</span>
                            <span className="text-muted-foreground text-lg">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {plans.paid.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-base text-foreground">
                                    <span className="text-primary text-xl">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => handleUpgrade('paid', plans.paid.stripeLink)}
                            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Upgrade Now - $10/month
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
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Grid,
    Paper
} from '@mui/material';
import { createPaymentIntent, confirmPayment } from '../../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

// Credit package options
const packages = [
    { id: 'small', name: 'Basic Pack', credits: 100, price: '$1.00', value: 'small' },
    { id: 'large', name: 'Value Pack', credits: 1100, price: '$10.00', value: 'large', best: true }
];

// Payment form component
const PaymentForm = ({ selectedPackage, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clientSecret, setClientSecret] = useState('');

    // Get payment intent on package selection
    useEffect(() => {
        if (selectedPackage) {
            setLoading(true);
            createPaymentIntent(selectedPackage)
                .then(data => {
                    setClientSecret(data.clientSecret);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error creating payment intent:', err);
                    setError('Failed to initialize payment. Please try again.');
                    setLoading(false);
                });
        }
    }, [selectedPackage]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setError(null);

        // Complete payment
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement)
            }
        });

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
        } else if (result.paymentIntent.status === 'succeeded') {
            // Payment successful, update credits
            try {
                await confirmPayment(result.paymentIntent.id);
                onSuccess();
            } catch (err) {
                setError('Payment successful, but failed to add credits. Please contact support.');
            }
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3, mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Card Details
                </Typography>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </Box>

            {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!stripe || loading || !clientSecret}
                >
                    {loading ? <CircularProgress size={24} /> : 'Pay Now'}
                </Button>
            </DialogActions>
        </form>
    );
};

// Main dialog component
const CreditPurchaseDialog = ({ open, onClose, creditsNeeded = 1 }) => {
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [step, setStep] = useState('select'); // 'select', 'payment', 'success'

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setStep('select');
            setSelectedPackage(null);
        }
    }, [open]);

    const handlePackageSelect = (packageValue) => {
        setSelectedPackage(packageValue);
        setStep('payment');
    };

    const handlePaymentSuccess = () => {
        setStep('success');
    };

    const handleClose = () => {
        // Clear localStorage flags
        localStorage.removeItem('showCreditPurchase');
        localStorage.removeItem('creditsNeeded');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {step === 'select' && 'Purchase Credits'}
                {step === 'payment' && 'Payment Details'}
                {step === 'success' && 'Purchase Successful'}
            </DialogTitle>

            <DialogContent>
                {step === 'select' && (
                    <>
                        <Typography variant="body1" paragraph>
                            You need {creditsNeeded} more credit{creditsNeeded > 1 ? 's' : ''} to analyze your tasks.
                            Purchase credits to continue using the AI analysis feature.
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {packages.map((pkg) => (
                                <Grid item xs={12} sm={6} key={pkg.id}>
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 2,
                                            border: pkg.best ? '2px solid #3f51b5' : 'none',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5'
                                            }
                                        }}
                                        onClick={() => handlePackageSelect(pkg.value)}
                                    >
                                        {pkg.best && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    backgroundColor: '#3f51b5',
                                                    color: 'white',
                                                    px: 1,
                                                    py: 0.5,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                BEST VALUE
                                            </Box>
                                        )}
                                        <Typography variant="h6" component="h3" gutterBottom>
                                            {pkg.name}
                                        </Typography>
                                        <Typography variant="h4" component="p" gutterBottom color="primary">
                                            {pkg.price}
                                        </Typography>
                                        <Typography variant="body2">
                                            {pkg.credits} credits
                                            {pkg.id === 'large' && (
                                                <Typography component="span" color="secondary" sx={{ ml: 1 }}>
                                                    (10% bonus)
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}

                {step === 'payment' && (
                    <Elements stripe={stripePromise}>
                        <PaymentForm
                            selectedPackage={selectedPackage}
                            onSuccess={handlePaymentSuccess}
                            onCancel={() => setStep('select')}
                        />
                    </Elements>
                )}

                {step === 'success' && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="primary" gutterBottom>
                            Thank you for your purchase!
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Your credits have been added to your account.
                        </Typography>
                        <Button variant="contained" color="primary" onClick={handleClose}>
                            Continue
                        </Button>
                    </Box>
                )}
            </DialogContent>

            {step === 'select' && (
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default CreditPurchaseDialog;
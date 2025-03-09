import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Chip
} from '@mui/material';
import api, { getCreditPackages, createCheckoutSession } from '../services/api';

/**
 * CreditPurchase component for displaying and purchasing credit packages
 */
const CreditPurchase = ({ onCreditsUpdated }) => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    // Fetch available credit packages
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                const response = await getCreditPackages();
                setPackages(Object.values(response.packages));
                setError('');
            } catch (err) {
                console.error('Error fetching credit packages:', err);

                // In development mode, use mock packages
                if (process.env.NODE_ENV === 'development') {
                    setPackages([
                        {
                            id: 'credit_small',
                            name: '300 Credits',
                            price: 4.99,
                            credits: 300,
                            description: 'Good for occasional use (300 note analyses)'
                        },
                        {
                            id: 'credit_medium',
                            name: '1,000 Credits',
                            price: 9.99,
                            credits: 1000,
                            description: 'Best value for regular users (1,000 note analyses)'
                        },
                        {
                            id: 'credit_large',
                            name: '5,000 Credits',
                            price: 34.99,
                            credits: 5000,
                            description: 'Ideal for power users (5,000 note analyses)'
                        }
                    ]);
                } else {
                    setError('Failed to load credit packages. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    // Handle package selection
    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        setDialogOpen(true);
    };

    // Handle dialog close
    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    // Handle purchase confirmation
    const handlePurchase = async () => {
        if (!selectedPackage) return;

        try {
            setPurchaseLoading(true);

            // Create checkout session
            const response = await createCheckoutSession(
                selectedPackage.id,
                `${window.location.origin}/app?purchase=success`,
                `${window.location.origin}/app?purchase=cancel`
            );

            // Redirect to Stripe checkout
            window.location.href = response.url;
        } catch (err) {
            console.error('Error creating checkout session:', err);
            setError('Failed to process payment. Please try again later.');
            setDialogOpen(false);
        } finally {
            setPurchaseLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && packages.length === 0) {
        return (
            <Box sx={{ py: 2 }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
                Purchase AI Credits
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Each note consumes 1 credit when analyzed. Purchase more credits below:
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {packages.map((pkg) => (
                    <Grid item xs={12} md={4} key={pkg.id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                border: pkg.id === 'credit_medium' ? '2px solid #2196f3' : '1px solid #e0e0e0',
                                boxShadow: pkg.id === 'credit_medium' ? 3 : 1
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                    {pkg.name}
                                </Typography>
                                <Typography variant="h4" color="primary" gutterBottom>
                                    ${pkg.price.toFixed(2)}
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    {pkg.credits.toLocaleString()} credits
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {pkg.description}
                                </Typography>
                                {pkg.id === 'credit_medium' && (
                                    <Chip
                                        label="Best Value"
                                        color="primary"
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </CardContent>
                            <CardActions>
                                <Button
                                    fullWidth
                                    variant={pkg.id === 'credit_medium' ? "contained" : "outlined"}
                                    onClick={() => handleSelectPackage(pkg)}
                                >
                                    Purchase
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Purchase confirmation dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                aria-labelledby="purchase-dialog-title"
            >
                <DialogTitle id="purchase-dialog-title">
                    Confirm Purchase
                </DialogTitle>
                <DialogContent>
                    {selectedPackage && (
                        <DialogContentText>
                            You are about to purchase {selectedPackage.credits.toLocaleString()} credits for ${selectedPackage.price.toFixed(2)}.
                            You will be redirected to our secure payment processor to complete your purchase.
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={purchaseLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePurchase}
                        color="primary"
                        variant="contained"
                        disabled={purchaseLoading}
                    >
                        {purchaseLoading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreditPurchase;
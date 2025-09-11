import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosInstance';

const CreditPurchaseModern = ({ onClose }) => {
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUserData } = useAuth();

  const packageDetails = {
    credit_small: {
      name: '300 Credits',
      price: 2.99,
      credits: 300,
      description: 'Good for occasional use',
      popular: false
    },
    credit_medium: {
      name: '1,000 Credits',
      price: 9.99,
      credits: 1000,
      description: 'Best value for regular users',
      popular: true
    },
    credit_large: {
      name: '5,000 Credits',
      price: 34.99,
      credits: 5000,
      description: 'Ideal for power users',
      popular: false
    }
  };

  const handlePurchase = async (packageId) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/purchases/create-checkout-session', {
        packageId
      });

      if (response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Failed to initiate purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Purchase Credits</h2>
              <p className="text-muted-foreground">
                You currently have <span className="font-semibold text-primary">{user?.credits || 0}</span> credits
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(packageDetails).map(([packageId, details]) => (
              <Card key={packageId} className={`relative ${details.popular ? 'border-primary' : ''}`}>
                {details.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{details.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    ${details.price}
                  </div>
                  <CardDescription>{details.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{details.credits.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">AI Analysis Credits</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cost per analysis</span>
                      <span>${(details.price / details.credits * 10).toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approximate analyses</span>
                      <span>~{Math.floor(details.credits / 10)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase(packageId)}
                    disabled={loading}
                    variant={details.popular ? "default" : "outline"}
                  >
                    {loading ? 'Processing...' : 'Purchase Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">How Credits Work</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Each AI analysis uses approximately 10 credits</li>
              <li>• Credits never expire</li>
              <li>• Secure payment processing via Stripe</li>
              <li>• Credits are added instantly after payment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchaseModern;
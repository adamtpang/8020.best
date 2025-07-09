import { ClerkProvider } from '@clerk/clerk-react';

// Get the publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
    console.warn('Missing Clerk publishable key');
}

export { CLERK_PUBLISHABLE_KEY };

// Clerk configuration
export const clerkConfig = {
    publishableKey: CLERK_PUBLISHABLE_KEY,
    appearance: {
        baseTheme: 'dark',
        variables: {
            colorPrimary: '#4CAF50',
            colorBackground: '#1a1a1a',
            colorInputBackground: '#2a2a2a',
            colorInputText: '#ffffff',
        },
        elements: {
            formButtonPrimary: {
                backgroundColor: '#4CAF50',
                '&:hover': {
                    backgroundColor: '#45a049',
                },
            },
        },
    },
};
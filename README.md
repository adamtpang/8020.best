# 8020.best - AI-Powered Task Prioritization

An application that helps prioritize tasks using AI, based on the Eisenhower Matrix methodology.

## Features
- AI analysis of tasks to determine importance and urgency
- Clean, modern UI for task management
- Credit system with 100 free credits for new users
- Secure user authentication

## Project Structure
- `frontend/` - React/Vite frontend application
- `backend/` - Node.js/Express backend API

## Setup Instructions

### Prerequisites
- Node.js 14+ and npm
- MongoDB database
- Firebase project (for authentication)
- Replicate API account (for AI analysis)

### Environment Variables Setup

For security reasons, environment variables containing API keys and credentials are not committed to version control. Follow these steps to set up your environment:

1. **Backend Setup**
   - Copy `.env.example` to create new `.env.development` and `.env.production` files:
   ```bash
   cp backend/.env.example backend/.env.development
   cp backend/.env.example backend/.env.production
   ```
   - Edit these files to add your actual credentials:
     - `MONGO_URI` - Your MongoDB connection string
     - `STRIPE_SECRET_KEY` - Your Stripe secret key (for payments)
     - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
     - `REPLICATE_API_TOKEN` - Get from https://replicate.com/account/api-tokens
     - `JWT_SECRET` - A secure random string for JWT authentication

2. **Frontend Setup**
   - Copy `.env.example` to create new `.env.development` and `.env.production` files:
   ```bash
   cp frontend/.env.example frontend/.env.development
   cp frontend/.env.example frontend/.env.production
   ```
   - Edit these files to add your Firebase credentials:
     - `VITE_FIREBASE_API_KEY` - Firebase API key
     - `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
     - And other Firebase configuration values

### Installation

1. **Install root dependencies**
   ```bash
   npm install
   ```

2. **Install frontend and backend dependencies**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   This will start both frontend and backend in development mode.

## Credit System

- New users start with 100 free credits
- Each task analyzed consumes 1 credit
- Additional credits can be purchased through the application

## Security Best Practices

- **Environment Variables**: Never commit actual API keys or secrets to version control
- **Development**: For local development, use the mock authentication option if Firebase auth fails
- **API Security**: The backend implements rate limiting and proper authentication

## Deployment

Follow these steps to deploy the application:

1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```

2. Set up your production environment variables using your hosting provider's environment management

3. Deploy the backend to your server or cloud provider

## License

[MIT License](LICENSE)
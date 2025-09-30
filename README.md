# 8020.best - AI-Powered Task Prioritization

**8020.best** is a smart task management application that uses AI to identify the 20% of your tasks that drive 80% of your results. Simple pricing, instant value.

![8020.best Screenshot](frontend/public/images/8020best-screenshot.png)

## Key Features

### 🎯 AI-Powered Task Analysis
- **80/20 Principle**: Automatically identifies the vital 20% of tasks that drive 80% of your results
- **Impact Scoring**: Each task gets a precise impact score (1-100) based on its potential value
- **Detailed Reasoning**: Understand exactly why the AI prioritized each task
- **Real-time Streaming**: Watch your tasks get analyzed in real-time

### 👤 User Accounts & Personalization
- **OAuth Authentication**: Sign in securely with Google or GitHub
- **Persistent Life Priorities**: Set your personal goals once - they're saved forever
- **Personalized Analysis**: AI considers your specific priorities when ranking tasks
- **Credit System**: 1000 free credits for new users, with master accounts getting unlimited usage

### 💎 Simple Pricing
- **Free Tier**: 5 runs per day (no credit card required)
- **Light ($5/mo)**: 300 runs per month
- **Pro ($10/mo)**: 1000 runs per month
- **Usage Tracking**: Real-time quota monitoring
- **Stripe Payment Links**: One-click upgrade, no complex checkout

### 🔒 Security & Privacy
- **Firebase Authentication**: Enterprise-grade security
- **JWT Tokens**: Secure API authentication
- **Data Privacy**: Your priorities and usage data are kept private
- **CORS Protection**: Secure cross-origin resource sharing

## Tech Stack

| Area      | Technology                                                                                                   |
|-----------|--------------------------------------------------------------------------------------------------------------|
| **Frontend**  | [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [Material-UI](https://mui.com/), [Axios](https://axios-http.com/) |
| **Backend**   | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Mongoose](https://mongoosejs.com/)                   |
| **Database**  | [MongoDB](https://www.mongodb.com/)                                                                          |
| **AI Model**  | [Replicate](https://replicate.com/) (GPT-4o-mini, Claude 3.5 Sonnet)                                         |
| **Auth**      | [Firebase Authentication](https://firebase.google.com/docs/auth)                                             |
| **Payments**  | [Stripe](https://stripe.com/)                                                                                |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/download/) (v16 or higher) and npm
- [MongoDB](https://www.mongodb.com/try/download/community) instance (local or cloud)
- A [Firebase](https://firebase.google.com/) project for authentication
- A [Replicate](https://replicate.com/) account for AI analysis API token

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd 8020.best
    ```

2.  **Install root dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend and frontend dependencies:**
    ```bash
    cd backend && npm install
    cd ../frontend && npm install && cd ..
    ```

4.  **Set up Environment Variables:**

    -   **Backend:** Copy the example file and fill in your credentials.
        ```bash
        cp backend/.env.example backend/.env.development
        ```
        Your `backend/.env.development` file should look like this:
        ```env
        MONGO_URI="your_mongodb_connection_string"
        REPLICATE_API_TOKEN="your_replicate_api_token"
        STRIPE_SECRET_KEY="your_stripe_secret_key"
        JWT_SECRET="your_jwt_secret"
        ```

    -   **Frontend:** Create a `.env.development` file in the `frontend` directory and add your Firebase config.
        ```env
        VITE_API_URL="http://localhost:5000/api"
        VITE_FIREBASE_API_KEY="your_firebase_api_key"
        VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
        VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
        VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
        VITE_FIREBASE_MESSAGING_SENDER_ID="your_firebase_sender_id"
        VITE_FIREBASE_APP_ID="your_firebase_app_id"
        ```

5.  **Run the application:**
    This command starts both the frontend and backend servers concurrently.
    ```bash
    npm run dev
    ```
    - Frontend will be available at `http://localhost:3000`
    - Backend will be available at `http://localhost:5000`

## API Endpoints

The enhanced AI analysis is handled by the following endpoints:

-   `POST /api/ai/analyze-task`
    -   Analyzes a single task and returns its classification with confidence and reasoning.
    -   Body: `{ "task": "your task text", "userContext": {} }`

-   `POST /api/ai/analysis-stats`
    -   Analyzes a batch of tasks and returns the results along with aggregate statistics (average confidence, etc.).
    -   Body: `{ "tasks": ["task1", "task2"], "userContext": {} }`

-   `GET /api/ai/test`
    -   A simple test endpoint to check if the AI service is running.

## Project Structure
```
/
├── backend/
│   ├── routes/         # Express routes (e.g., ai.js, users.js)
│   ├── services/       # Business logic (e.g., taskAnalysis.js)
│   ├── models/         # Mongoose schemas
│   ├── middleware/     # Custom middleware
│   └── server.js       # Main backend server file
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API clients (e.g., aiPrioritization.js)
│   │   ├── contexts/   # React contexts (e.g., AuthContext)
│   │   └── App.jsx     # Main app component
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 14+ and npm
- MongoDB database
- Firebase project (for authentication)
- Replicate API account (for AI analysis)

### 🔧 Environment Variables Setup

The app now includes a comprehensive freemium authentication system. Set up your environment variables:

1. **Backend Setup (`backend/.env.development`)**
   ```bash
   cp backend/.env.example backend/.env.development
   ```
   Add your credentials:
   ```env
   MONGO_URI="mongodb://localhost:27017/8020best"
   REPLICATE_API_TOKEN="your_replicate_api_token"
   JWT_SECRET="your_secure_jwt_secret_here"
   FIREBASE_PROJECT_ID="your_firebase_project_id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

2. **Frontend Setup (`frontend/.env.development`)**
   ```bash
   cp frontend/.env.example frontend/.env.development
   ```
   Add your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY="your_firebase_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
   VITE_FIREBASE_APP_ID="your_app_id"
   VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id"
   ```

### 🔥 Firebase Setup (Required for Authentication)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication with Google and GitHub providers
4. Generate a private key for Firebase Admin SDK:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file and extract the required fields
5. Add your domain to authorized domains in Authentication settings

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

## 💳 Pricing & Quotas

### How It Works
- **Free Users**: 5 runs/day (tracked by IP + browser)
- **Light Plan ($5/mo)**: 300 runs/month soft-limit (20% grace)
- **Pro Plan ($10/mo)**: 1000 runs/month soft-limit (20% grace)
- **Master Accounts**: Unlimited (for admin testing)

### Pricing Knobs (Environment Variables)

You can adjust these in your `.env` file:

```env
FREE_RUNS_PER_DAY=5              # Daily limit for free users
LIGHT_MONTHLY_SOFT_LIMIT=300     # Monthly soft-limit for Light plan
PRO_MONTHLY_SOFT_LIMIT=1000      # Monthly soft-limit for Pro plan
OVERAGE_GRACE_PERCENT=20         # Grace % before hard block
```

### Stripe Payment Links Setup

1. Create Payment Links at https://dashboard.stripe.com/payment-links:
   - **Light Plan**: $5/month recurring
   - **Pro Plan**: $10/month recurring
   - Enable "Collect customer email" for user matching

2. Copy the Payment Link URLs to your `.env`:
   ```env
   STRIPE_LINK_LIGHT=https://buy.stripe.com/YOUR_LIGHT_LINK
   STRIPE_LINK_PRO=https://buy.stripe.com/YOUR_PRO_LINK
   ```

3. Set up webhooks at https://dashboard.stripe.com/webhooks:
   - **Webhook URL**: `https://yourdomain.com/api/stripe/webhook`
   - **Events to subscribe**:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - Copy webhook secret to `.env`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
     ```

### Usage Tracking
- Real-time quota display in UI
- Daily usage (for free users via IP + browser fingerprint)
- Monthly usage (for paid users via user ID)
- Automatic monthly reset

## Security Best Practices

- **Environment Variables**: Never commit actual API keys or secrets to version control
- **Development**: For local development, use the mock authentication option if Firebase auth fails
- **API Security**: The backend implements rate limiting and proper authentication

## Deployment to Vercel

### Quick Deploy

1. **Build the frontend**:
   ```bash
   cd frontend && npm run build
   ```

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables in Vercel dashboard:
     - All variables from `.env.example`
     - Point `MONGO_URI` to your MongoDB Atlas cluster
     - Set `NODE_ENV=production`
   - Deploy!

4. **Update Stripe Webhook URL**:
   - Once deployed, update your Stripe webhook URL to:
     `https://your-vercel-domain.vercel.app/api/stripe/webhook`

### Environment Variables for Production

Required variables in Vercel:
- `NODE_ENV=production`
- `MONGO_URI` (MongoDB Atlas connection string)
- `REPLICATE_API_TOKEN`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `JWT_SECRET`
- `STRIPE_LINK_LIGHT`, `STRIPE_LINK_PRO`, `STRIPE_WEBHOOK_SECRET`
- `FREE_RUNS_PER_DAY`, `LIGHT_MONTHLY_SOFT_LIMIT`, `PRO_MONTHLY_SOFT_LIMIT`

## Lightweight Pricing Philosophy

Start with **$5 Light / $10 Pro** and `FREE_RUNS_PER_DAY=5`.

### Weekly Monitoring

Track these metrics:
- **Conversion rate** (free→paid): Target 2%+
- **Active paid users**
- **ARPU** (Average Revenue Per User)
- **Churn rate**

### When to Adjust

| Scenario | Action |
|----------|--------|
| Conversion < 2% | Increase perceived value (speed, reliability, features) before changing price |
| Heavy abuse on $5 | Drop soft-limit to 200 runs or add small overage packs |
| Strong demand | Test $7 Light via A/B with `PRICE_TEST_BUCKET` env flag |
| Cost per run changes | Recalculate to maintain >70% gross margin |

### Quick Experiments

```env
# A/B test pricing (show 20% of new users $7 Light)
PRICE_TEST_BUCKET=B

# Toggle free runs 3-7/day to find sweet spot
FREE_RUNS_PER_DAY=3

# Enable Pro-only features
ENABLE_NOTION_EXPORT=true  # Pro only
```

## License

[MIT License](LICENSE)
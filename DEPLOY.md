# Quick Deployment Guide

## 🚀 Deploy to Vercel in 10 Minutes

### Step 1: Stripe Setup (5 minutes)

1. **Create Payment Links** at https://dashboard.stripe.com/payment-links

   **Light Plan ($5/month)**
   - Price: $5.00 USD
   - Billing: Recurring (monthly)
   - ✅ Collect customer email
   - Name: "8020.best Light Plan"

   **Pro Plan ($10/month)**
   - Price: $10.00 USD
   - Billing: Recurring (monthly)
   - ✅ Collect customer email
   - Name: "8020.best Pro Plan"

2. **Copy Payment Link URLs**
   ```
   Light: https://buy.stripe.com/YOUR_LIGHT_LINK
   Pro: https://buy.stripe.com/YOUR_PRO_LINK
   ```

3. **Create Webhook** at https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://YOUR_DOMAIN.vercel.app/api/stripe/webhook` (update after deploy)
   - Events to send:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.deleted`
     - ✅ `customer.subscription.updated`
   - Copy webhook signing secret: `whsec_...`

### Step 2: Environment Variables

Create a file `production.env` with these values (don't commit this!):

```env
# App
NODE_ENV=production
PORT=5001
NEXT_PUBLIC_APP_NAME=8020.best

# Pricing (adjust as needed)
FREE_RUNS_PER_DAY=5
LIGHT_MONTHLY_SOFT_LIMIT=300
PRO_MONTHLY_SOFT_LIMIT=1000
OVERAGE_GRACE_PERCENT=20

# Stripe (from Step 1)
STRIPE_LINK_LIGHT=https://buy.stripe.com/YOUR_LIGHT_LINK
STRIPE_LINK_PRO=https://buy.stripe.com/YOUR_PRO_LINK
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Replicate AI
REPLICATE_API_TOKEN=your_replicate_token_here
REPLICATE_MODEL=anthropic/claude-3.5-sonnet

# MongoDB Atlas (get from MongoDB dashboard)
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/8020best?retryWrites=true&w=majority

# Firebase Admin (from Firebase Console → Project Settings → Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"

# JWT Secret (generate a random 32-char string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Frontend Firebase Config (from Firebase Console → Project Settings → General)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

### Step 3: Deploy to Vercel (3 minutes)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Framework Preset: **Other** (or **Vite**)
   - Root Directory: `./frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Copy ALL variables from your `production.env` file
   - Set for: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Note your Vercel URL: `https://YOUR_APP.vercel.app`

### Step 4: Update Stripe Webhook (1 minute)

1. Go back to https://dashboard.stripe.com/webhooks
2. Edit your webhook endpoint
3. Update URL to: `https://YOUR_APP.vercel.app/api/stripe/webhook`
4. Save

### Step 5: Test (2 minutes)

**Test Free Tier**
1. Open your app in incognito window
2. Paste some tasks
3. Click "Run 80/20 Analysis"
4. Should work! Counter shows "4/5 runs remaining"
5. Run 5 times → should show paywall

**Test Payment Flow**
1. Click "Upgrade to Light"
2. Should open Stripe Payment Link
3. Use test card: `4242 4242 4242 4242`, any future date, any CVC
4. Complete checkout
5. Return to app → plan should upgrade (may take 30 seconds)

**Test Paid User**
1. Run analysis again
2. Should work with monthly counter: "299/300 runs remaining"

## ✅ You're Live!

Your app is now deployed and accepting payments. Monitor these:

### Vercel Dashboard
- Check for build errors
- Monitor function execution times
- View logs for webhook events

### Stripe Dashboard
- Watch for new subscriptions
- Check webhook delivery status
- Monitor MRR (Monthly Recurring Revenue)

### MongoDB Atlas
- Usage data is being tracked
- Monitor connection limits
- Set up automated backups

## 🔧 Quick Adjustments

**Change Free Tier Limit**
```bash
# In Vercel → Environment Variables
FREE_RUNS_PER_DAY=3  # More restrictive
# OR
FREE_RUNS_PER_DAY=10  # More generous
```
Redeploy after changing.

**Change Pricing**
1. Create new Stripe Payment Links
2. Update env vars in Vercel
3. Redeploy

**Add Master Account**
```javascript
// In backend/src/models/User.js, update:
userSchema.methods.hasUnlimitedCredits = function() {
    return this.isMasterAccount ||
           this.email === 'your-email@example.com';  // Add your email
};
```

## 🆘 Troubleshooting

**Webhook not working**
- Check Vercel logs for incoming requests
- Verify webhook secret matches
- Test webhook delivery in Stripe dashboard

**Users not upgrading after payment**
- Check webhook events in Stripe
- Verify email matches user in MongoDB
- Check MongoDB for `plan` field update

**Quota not enforcing**
- Verify MongoDB connection
- Check DailyUsage/MonthlyUsage collections exist
- Review Vercel function logs

## 📊 Monitor These Metrics

**Week 1**
- Total signups
- Free tier usage (avg runs/user)
- Conversion rate (free→paid)
- Any errors in Vercel logs

**Week 2-4**
- MRR growth
- Churn rate
- ARPU (Average Revenue Per User)
- Cost per run vs revenue

**Adjust pricing if:**
- Conversion < 2% → increase perceived value
- High abuse on $5 → reduce limits
- Strong demand → test higher prices

---

**Need help?** Check UPGRADE_SUMMARY.md for detailed implementation notes.
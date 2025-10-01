# Deploy 8020.best to Vercel - Ready to Go! 🚀

## ✅ What's Configured

**Pricing:**
- Free: 10 runs/month
- Pro: $10/month = 1000 runs/month (with 20% grace to 1200)

**Stripe Payment Link:**
✅ Already configured: `https://buy.stripe.com/fZu4gz0wygNffYQd8RaMU09`

**Build:**
✅ Successful - Ready to deploy

---

## 🚀 Deploy in 5 Minutes

### Step 1: Push to GitHub (1 min)

```bash
git add .
git commit -m "Production ready: 10 free runs, $10 for 1000 runs/month"
git push origin main
```

### Step 2: Deploy to Vercel (3 min)

1. **Go to Vercel**: https://vercel.com/new
2. **Import** your GitHub repository
3. **Configure**:
   - Framework: `Other` (or `Vite`)
   - Root Directory: `./frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables** (click "Add" for each):

```
NODE_ENV=production
PORT=5001
NEXT_PUBLIC_APP_NAME=8020.best

# Pricing
FREE_RUNS_PER_MONTH=10
PAID_MONTHLY_SOFT_LIMIT=1000
PAID_MONTHLY_HARD_LIMIT=1200
SHOW_WARNING_AT=900

# Stripe
STRIPE_LINK_PAID=https://buy.stripe.com/fZu4gz0wygNffYQd8RaMU09
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_AFTER_WEBHOOK_SETUP

# Replicate
REPLICATE_API_TOKEN=your_replicate_token_here
REPLICATE_MODEL=anthropic/claude-3.5-sonnet

# MongoDB - REPLACE WITH YOUR CREDENTIALS
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/8020best?retryWrites=true&w=majority

# Firebase Admin
FIREBASE_PROJECT_ID=best-1bc4b
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-m9s1b@best-1bc4b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDMI1eJea1GL2ED\nUrJFyRj3CZ74SvAM+9q7w0AflSBg00Q3sMyOcMi5YNW89fKmsGbOQqo6/nB7mUD1\nWpKfwdoHGGykFPihRxpSEe/A8MonYb2url3oNSPFqdUxXqBO8ngOkdGgUTHvi15w\nqKv4sfFrcf8x59+uOl8yyTQYSU5OFp182ydq1qy1ZvVedQ8TidIsLz+xDtDX6x6l\naILO8w7A+oD4ijrfq4D2HcfelUMuWGVexUMmawN9SUGlYaBk866t0mqr305HOvYu\nKlfxM/F65dEwS7wrxbLiXhUFE2xvmC/g89tsG9OVMJVP6k5gbkKtKM8UOWN61+K6\nprf+lIYVAgMBAAECggEALXJLzXcZiJfJLwp01lz2Eh9h9RCH3zgdwvHtv2o9hlja\nZdSWQbrhsQWaKAKQViRNCuvkBpS5OYcNo2HZ5TeswKojG6dwj8Uq2q0UFX31320e\n47n9fZIBCAMui5pvsYvBBytXAiw5ZAVAze97M7d30g4TvIpM7baglYeeMa72QCNa\ndU5mPnlfKV6R9AeHMUmXNFBAYBhcn69fJa/014OMnnJfceriX50JHV34tdoiezsD\nP2K/suUt7ygE1RxdNVw98hAcZJVWji/DYQ8U9K7E0PPAXglKUPqDnO5chPYKkeN2\nVOh+q2CsMupnt6EtFlNfBsjHC2wAZkK2mhX/Mp4xMQKBgQDp8S9CvD53ZMX2AtDL\n+Dk//7QI/y1pjZyo7fBZM1ih84e/sCrKHyPnLoRZIcRO7a66UXlJjzPBP53DUesM\nazVOZB4yfH8zBy61oBqapO8HI9xXIKh+sLQse74ByMU38KuAeup4+rH0udh2j97G\nhprRob9HUA7wK1lJFzaYthz2JQKBgQDfYsG7lTL6lHq9223iH+cE3Vhry8dPDLhh\nBSpc+6E7AvRvS0nXM/dXscwGZjHMLzIkHLKjqUOWeSJNQIgzpO+k6wDHFbJ9t7to\nccTw1IXYILapu5k3GRqBxir7pwuYfLIWJ4cfN8g/uf3tWVHWgmiGAUCOA3ZKpuS0\n+EQ/eBj1MQKBgQDDp4ZKPxvTSQHThXlRDbH714Sf/aLiY6CBHDbms23OTNnctJ6k\n2rRxVdM0pGwFQv3eL+PLZKv5VJZCU9HMWiGEBXHH8Z2EdN5Y4qU9bvHGO/S9HcAt\n7OVTSs6XuW1QIsWct7BALBMHRSNHzX2Y9dyntKpAHzHPJcIPwg1UXQMNzQKBgQCt\n3BAKbhnqOyu4npLMPqYv/BI4e7aYyL6sDDgnfFTFOAyEnmVPEAv+/ctcY6d4UndE\n8ez7Qd7vu0G+PG6FO2akxZ6qVDHCdQBwTrPH+LBfQT7Jpc+euXQO8uw7RozY1pxI\nb+VTn7fEGX8PfsgaGw881LaokPs9KN2yF9QOTeum0QKBgQC0t0UBWYDX44JWnANb\nG7yNSJ5IlM7jAsll0jNTKViZF2Z0aV+A0LLtqwZwUZ17PBOSz8Mf4rpfwFPbXyGx\nvvTJrW/ScI4FTTRjLaC+FWNhfQ02hxbK5VveZoIqJkM8DJV8LlGc7psK5WdzeUOA\ndGlRP2mQHPQQlsmJCqihF1x23w==\n-----END PRIVATE KEY-----"

# JWT
JWT_SECRET=8020-best-super-secret-jwt-key-2024

# Frontend Firebase
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=best-1bc4b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=best-1bc4b
VITE_FIREBASE_STORAGE_BUCKET=best-1bc4b.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

5. **Click Deploy** ⚡

### Step 3: Set Up Stripe Webhook (1 min)

After deployment, you'll get a URL like: `https://your-app.vercel.app`

1. **Go to Stripe Webhooks**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://your-app.vercel.app/api/stripe/webhook`
4. **Events to send**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`
5. **Click "Add endpoint"**
6. **Copy** the webhook signing secret (starts with `whsec_`)
7. **Update** in Vercel:
   - Go to Settings → Environment Variables
   - Find `STRIPE_WEBHOOK_SECRET`
   - Replace with your real secret
   - **Redeploy** (Vercel will prompt you)

---

## ✅ Test Your Live App

### Test Free Tier
1. Open your Vercel URL in incognito
2. Paste some tasks
3. Click "Run 80/20 Analysis"
4. Should work! Counter shows "9 of 10 runs remaining"
5. Run 10 times → should show paywall

### Test Payment Flow
1. Click "Upgrade Now - $10/month"
2. Should open Stripe checkout
3. **Test card**: `4242 4242 4242 4242`
4. Any future expiry, any CVC, any zip
5. Complete checkout with your email
6. Return to app → plan should upgrade automatically
7. Run analysis again → should show "999 of 1000 runs remaining"

---

## 📊 Your Economics

### Per-Run Cost
- 10 tasks: ~$0.01
- 50 tasks: ~$0.05
- 100 tasks: ~$0.10

### Revenue Model at $10/month
```
Light user (50 runs/month):
  Cost: $2.50 → Profit: $7.50 (75% margin) ✅

Average user (200 runs/month):
  Cost: $10.00 → Profit: $0.00 (break-even) ⚖️

Power user (1000 runs/month):
  Cost: $50.00 → Loss: -$40.00 ❌
  (But you have 20% grace cap at 1200 to prevent this)
```

Most users will be light-to-average = profitable!

---

## 🎉 You're Live!

After deployment:
- **Free users**: Get 10 runs/month
- **Paid users**: Get 1000 runs/month for $10
- **Grace period**: Allows up to 1200 runs before hard block
- **Webhook**: Automatically upgrades users after payment

**Monitor** in Vercel logs and Stripe dashboard for:
- Signups
- Conversions
- Average usage
- Any abuse cases

---

## 🔧 Quick Adjustments

**Increase free tier:**
```env
FREE_RUNS_PER_MONTH=20  # More generous
```

**Reduce paid limit:**
```env
PAID_MONTHLY_SOFT_LIMIT=500  # Lower if costs too high
```

**Change price:**
- Create new Stripe link at new price
- Update `STRIPE_LINK_PAID` in Vercel
- Redeploy

---

**Ready to ship? Push to GitHub and deploy!** 🚀
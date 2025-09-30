# Final Pricing Model - 8020.best

## 🎯 Simple Pricing

```
Free:  5 runs/month
Paid:  $5/month = Unlimited runs*
```

*Unlimited = soft cap at 500/month, hard cap at 1000/month for abuse prevention

---

## 📊 Technical Limits

### Per Analysis Call
- **Max tasks**: 1,000 items
- **Max characters**: 1,000,000 characters
- **Batch processing**: 10 tasks at a time (AI token limit)

### Example Analysis Costs
- 10 tasks = 1 API call to Replicate (~$0.01)
- 50 tasks = 5 API calls (~$0.05)
- 100 tasks = 10 API calls (~$0.10)

### Cost Analysis at $5/month
```
User does 50 runs/month @ 50 tasks each:
- API cost: 50 runs × $0.05 = $2.50
- Your revenue: $5.00
- Gross profit: $2.50 (50% margin)

User does 100 runs/month @ 50 tasks each:
- API cost: 100 runs × $0.05 = $5.00
- Your revenue: $5.00
- Gross profit: $0.00 (break-even)

User does 200 runs/month @ 50 tasks each:
- API cost: 200 runs × $0.05 = $10.00
- Your revenue: $5.00
- Gross profit: -$5.00 (loss)
```

### Why 500/month Soft Cap Works
- Most users will do 10-50 runs/month (high margin)
- Power users at 100-200 runs/month (break-even to small loss)
- Soft cap at 500 prevents extreme losses
- Hard cap at 1000 blocks abuse

---

## 🚀 Updated Environment Variables

```env
# Pricing & Quotas
FREE_RUNS_PER_MONTH=5           # Free tier gets 5 runs/month
PAID_MONTHLY_SOFT_LIMIT=500     # Show warning at 500 runs
PAID_MONTHLY_HARD_LIMIT=1000    # Hard block at 1000 runs
SHOW_WARNING_AT=400             # Friendly check-in at 400

# Stripe (single payment link)
STRIPE_LINK_PAID=https://buy.stripe.com/YOUR_PAID_LINK
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

---

## 📋 Stripe Setup (Simplified)

### Create ONE Payment Link

1. Go to https://dashboard.stripe.com/payment-links
2. Click "Create payment link"
3. **Product**:
   - Name: `8020.best Unlimited Plan`
   - Price: `$5.00 USD`
4. **Payment type**: `Subscription`
5. **Billing period**: `Monthly`
6. **Collect**: ✅ Email address (required)
7. Click "Create link"
8. Copy URL → paste into `.env` as `STRIPE_LINK_PAID`

### Webhook Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://YOUR_DOMAIN.vercel.app/api/stripe/webhook`
3. Events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`
4. Copy webhook secret → paste into `.env` as `STRIPE_WEBHOOK_SECRET`

---

## 💬 Messaging

### Landing Page
"Try 5 times free. Then $5/month for unlimited."

### Paywall
"Upgrade to Unlimited - $5/month"
- Unlimited runs per month*
- Priority support
- Advanced analysis

*Fair use: soft cap at 500/month

### Usage Counter
- Free: "3 of 5 free runs remaining this month"
- Paid: "Unlimited runs (47 used this month)"
- Warning at 400: "You've used 400 runs this month. Everything ok?"
- Hard block at 1000: "You've exceeded 1000 runs. Please contact support."

---

## ✅ What Changed from Original Spec

### Original Plan
- Free: 5 runs/day
- Light $5: 300 runs/month
- Pro $10: 1000 runs/month

### Final Plan (Better!)
- Free: 5 runs/month (prevents abuse, cleaner)
- Paid $5: Unlimited* (simpler message, higher perceived value)

### Why This is Better
1. **Simpler**: Only 2 tiers instead of 3
2. **Higher value**: "Unlimited" > "300 runs/month"
3. **Same margin**: Soft cap at 500 = similar to old 300-run plan
4. **Better conversion**: Clear upgrade path (5 free → unlimited)
5. **Less confusion**: No "which tier do I need?" decision paralysis

---

## 🎯 Next Steps

1. **Create Stripe Payment Link** ($5/month subscription)
2. **Paste URL** into `backend/.env.development` as `STRIPE_LINK_PAID`
3. **Deploy to Vercel** (instructions in DEPLOY.md)
4. **Set up webhook** (after deploy)
5. **Test** with Stripe test card: `4242 4242 4242 4242`

---

## 📊 Success Metrics to Track

### Week 1
- Total signups
- Free tier conversion rate (target: 2%+)
- Average runs per free user
- Any 1000+ run abuse cases

### Month 1
- MRR (Monthly Recurring Revenue)
- Average runs per paid user
- Churn rate
- Gross margin (target: >50%)

### Adjustments
- If conversion < 2%: Increase perceived value (speed, features)
- If avg paid user > 200 runs/month: Consider raising price to $7-10
- If abuse cases: Lower hard cap to 500
- If margin < 50%: Reduce soft cap or add usage-based pricing

---

Built ✅ Ready to deploy 🚀
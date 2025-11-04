# 🚀 Migration to Vercel Serverless Functions (100% FREE!)

## Why This Change?

**Railway costs money** 💸 - Vercel serverless functions are **100% FREE** for your use case!

## What Changed

### Before (Railway):
- Backend: Separate Node.js server on Railway ($$$)
- Frontend: Static site on Vercel
- Issues: CORS, double `/api/api/` paths, costs money

### After (Vercel):
- Backend: Serverless functions on Vercel (FREE!)
- Frontend: Static site on Vercel (FREE!)
- Benefits: No CORS issues, same domain, 100% free!

## New Structure

```
8020.best/
├── api/                      # Vercel serverless functions
│   ├── health.js            # Health check endpoint
│   └── ai/
│       ├── rank-tasks.js    # AI task ranking (main feature)
│       └── usage.js         # Usage tracking
├── frontend/                 # React frontend
│   ├── dist/                # Built frontend (served by Vercel)
│   └── src/                 # Source code
├── vercel.json              # Vercel configuration
└── package.json             # Root package with replicate dependency
```

## Deployment Steps

### 1. Set Environment Variables in Vercel

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Required:**
```
REPLICATE_API_TOKEN=your_replicate_token_here
```

**Firebase (already set):**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- etc.

### 2. Delete Old Environment Variable

**DELETE** or **LEAVE EMPTY**:
- `VITE_API_URL` - Not needed anymore! Uses same domain.

### 3. Push to Deploy

```bash
git add -A
git commit -m "Migrate to Vercel serverless functions (FREE!)"
git push origin main
```

Vercel will automatically deploy!

### 4. Verify Deployment

Test these URLs after deployment:

1. **Health check:**
   ```
   https://www.8020.best/api/health
   ```
   Should return: `{"status":"ok","time":"...","platform":"vercel"}`

2. **Frontend:**
   ```
   https://www.8020.best
   ```
   Should load the app

3. **AI Ranking:** (Test through the app UI)
   - Add tasks
   - Click analyze
   - Should work without CORS errors!

## Benefits

✅ **100% FREE** - No Railway costs
✅ **No CORS issues** - Same domain
✅ **Simpler architecture** - One deployment
✅ **Auto-scaling** - Vercel handles it
✅ **Fast cold starts** - Serverless functions
✅ **Global CDN** - Fast everywhere

## API Endpoints

All API endpoints are now at:
- `https://www.8020.best/api/health`
- `https://www.8020.best/api/ai/usage`
- `https://www.8020.best/api/ai/rank-tasks`

No more Railway URLs!

## Troubleshooting

### Issue: "Module not found: replicate"
**Solution:** Vercel will install dependencies from root `package.json` automatically

### Issue: "REPLICATE_API_TOKEN is not defined"
**Solution:** Set it in Vercel dashboard environment variables

### Issue: Still seeing Railway URLs
**Solution:** 
1. Clear browser cache
2. Check that `VITE_API_URL` is empty or deleted in Vercel
3. Redeploy

## Cost Comparison

### Railway (Old):
- $5/month minimum
- Plus overages

### Vercel (New):
- **$0/month** ✨
- 100GB bandwidth (more than enough)
- Unlimited serverless function invocations (hobby plan)

**Savings: $60/year!** 💰

## Next Steps

1. ✅ Set `REPLICATE_API_TOKEN` in Vercel
2. ✅ Push code to deploy
3. ✅ Test at https://www.8020.best
4. ✅ Delete Railway project (save money!)

## Questions?

Everything runs on Vercel now - frontend AND backend!

# Vercel Environment Variable Setup - UPDATED

## ✅ Critical Fix Applied

The app has been fixed to resolve the double `/api/api/` path issue and CORS errors.

## What Was Fixed

1. **Removed `/api` from `VITE_API_URL`**
   - Old (wrong): `https://8020best-production.up.railway.app/api`
   - New (correct): `https://8020best-production.up.railway.app`
   
2. **Enhanced CORS configuration** in backend with explicit:
   - Allowed methods: GET, POST, PUT, DELETE, OPTIONS
   - Allowed headers: Content-Type, Authorization
   - Preflight OPTIONS handler

3. **Updated all API calls** to include `/api` in the path

## Vercel Dashboard Setup

Go to Vercel and update the environment variable:

### Steps:

1. Go to https://vercel.com/dashboard
2. Select your `8020.best` project
3. Navigate to **Settings** → **Environment Variables**
4. **DELETE or UPDATE** the old `VITE_API_URL` if it exists
5. **Set the correct value:**

```
Name: VITE_API_URL
Value: https://8020best-production.up.railway.app
Environments: ☑ Production ☑ Preview ☑ Development
```

**IMPORTANT:** The value should NOT include `/api` at the end!

6. Click **Save**
7. Go to **Deployments** tab
8. **Redeploy** the latest deployment

## Railway Backend

The backend on Railway should automatically redeploy when you push to GitHub. 
If not, manually trigger a redeploy on Railway.

## After Deployment

✅ The app should now work correctly:
- No more `/api/api/ai/usage` double path errors
- No more CORS errors
- API calls to: `https://8020best-production.up.railway.app/api/ai/usage`
- Successful Google Sign In
- Priorities auto-save when authenticated

## Troubleshooting

If errors persist:
1. Check both Vercel and Railway are using latest code
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for any remaining errors
4. Verify Railway backend is running and accessible

## Testing

Test these URLs directly:
- Backend health: https://8020best-production.up.railway.app/api/health
- Should return: `{"status":"ok","time":"..."}`

If this works, but the frontend doesn't, redeploy Vercel again.

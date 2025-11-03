# Vercel Environment Variable Setup

## Critical Setup Required

You MUST configure the following environment variable in Vercel Dashboard:

### Steps:

1. Go to https://vercel.com/dashboard
2. Select your `8020.best` project
3. Navigate to **Settings** → **Environment Variables**
4. Delete any old/incorrect environment variables like `api.8020.best`
5. Add this NEW variable:

```
Name: VITE_API_URL
Value: https://8020best-production.up.railway.app/api
Environments: ☑ Production ☑ Preview ☑ Development
```

6. Click **Save**
7. Go to **Deployments** tab
8. Click the **...** menu on the latest deployment
9. Select **Redeploy**

### Verification

After redeployment, the app should:
- Load without `api.8020.best` errors
- Successfully connect to Railway backend
- Show Google Sign In button
- Save priorities when authenticated

### Troubleshooting

If you still see `api.8020.best` errors:
1. Check Vercel dashboard for any old environment variables
2. Delete them
3. Ensure `VITE_API_URL` is set correctly
4. Redeploy again (sometimes needs 2 deploys to clear cache)

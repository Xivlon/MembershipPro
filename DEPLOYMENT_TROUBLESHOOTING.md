# Deployment Troubleshooting Guide

## Issue: Subscription Options Not Appearing on Cloudflare

### Problem
The membership plans are not showing up in the production deployment, while they work fine locally.

### Root Cause
The issue is likely one of the following:
1. Missing `STRIPE_SECRET_KEY` environment variable in the production environment
2. API endpoints not being served correctly in the production build
3. CORS issues preventing API calls from the frontend

### Solution Steps

#### Step 1: Check Environment Variables
Ensure the `STRIPE_SECRET_KEY` is properly set in your Cloudflare deployment:

1. Go to your Cloudflare dashboard
2. Navigate to your deployment settings
3. Add environment variable: `STRIPE_SECRET_KEY` with your actual Stripe secret key
4. Redeploy the application

#### Step 2: Test API Endpoints
You can test if the API is working by visiting these URLs in your browser:

- `https://your-domain.com/api/health` - Should show server status and Stripe configuration
- `https://your-domain.com/api/membership-plans` - Should return the membership plans JSON

#### Step 3: Check Browser Console
Open your browser's developer tools (F12) and check the Console tab for any errors when loading the membership page.

#### Step 4: Test with curl
Test the API from command line:
```bash
curl -X GET https://your-domain.com/api/membership-plans
curl -X GET https://your-domain.com/api/health
```

### Expected Behavior
- `/api/health` should return: `{"status":"ok","environment":"production","stripe_configured":true,"timestamp":"..."}`
- `/api/membership-plans` should return an array of membership plans

### Common Error Messages and Solutions

#### "JSON.parse: unexpected character at line 1 column 1"
This means the API endpoint is returning HTML instead of JSON, which indicates:
1. **API routes not configured**: The server is serving the frontend HTML for API requests
2. **Missing environment variables**: The server failed to start properly due to missing config
3. **Build issues**: The production build didn't include the API routes correctly

**Solution**: 
- Verify the build includes both client and server components
- Check that API routes are registered before static file serving
- Ensure all environment variables are set in production

#### "Failed to fetch" or Network Errors
- Check CORS configuration if deploying to a different domain
- Verify the production server is running on the correct port
- Ensure firewall/security settings allow API requests

### If Problems Persist
1. Check that the build process completed successfully
2. Verify that the `dist` folder contains both the client assets and the server bundle
3. Ensure the production server is starting correctly and serving both static files and API routes

### Contact Support
If you continue to have issues, please contact support with:
- The exact error message from the browser console
- The response from `/api/health`
- Your deployment configuration
# X (Twitter) OAuth Setup Guide

## Important: Fix for "You weren't able to give access to the App" Error

This error typically occurs due to OAuth configuration issues. Follow these steps to fix it:

## 1. X Developer Portal Configuration

### Step 1: Access Your App Settings
1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Navigate to your app's settings
3. Click on "User authentication settings"

### Step 2: Configure OAuth 2.0 Settings
Make sure these settings are configured correctly:

#### App Permissions:
- ✅ **Read** (Required)
- ✅ **Write** (Required for posting)
- ✅ **Direct Messages** (Optional)

#### Type of App:
- Select: **Web App, Automated App or Bot**

#### App Info:
- **Callback URI / Redirect URL**: 
  ```
  http://localhost:5000/api/auth/twitter/callback
  ```
  ⚠️ **MUST match exactly** - including the protocol (http/https) and port!

- **Website URL**: 
  ```
  http://localhost:3000
  ```

#### Client ID and Secret:
- After saving, copy your **Client ID** and **Client Secret**
- These should match what's in your `.env` file

## 2. Backend Configuration (.env file)

Create or update `/backend/.env`:

```env
# X API Credentials
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here

# Optional: Specify callback URL if different from default
# CALLBACK_URL=http://localhost:5000/api/auth/twitter/callback

# Optional: Frontend URL if different from default
# FRONTEND_URL=http://localhost:3000
```

## 3. Common Issues and Solutions

### Issue 1: "You weren't able to give access to the App"
**Causes & Solutions:**
1. **Callback URL mismatch**: Ensure the callback URL in X Developer Portal EXACTLY matches `http://localhost:5000/api/auth/twitter/callback`
2. **App not approved**: Make sure your app has been approved for the requested permissions
3. **Session expired**: Clear cookies and try again

### Issue 2: "403 Forbidden" when posting
**Solution:** Your app needs "Write" permissions. Update in X Developer Portal.

### Issue 3: "Invalid client_id"
**Solution:** Double-check your Client ID in both `.env` and X Developer Portal.

## 4. Testing the Fix

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Clear browser data:**
   - Clear cookies for localhost
   - Clear localStorage
   - Use incognito/private mode for testing

4. **Try logging in again:**
   - Click "Login with X to Post"
   - You should see X's authorization page
   - Click "Authorize app"
   - You should be redirected back and logged in

## 5. Production Deployment

When deploying to production, update:

1. **X Developer Portal:**
   - Change callback URL to: `https://yourdomain.com/api/auth/twitter/callback`
   - Update website URL to: `https://yourdomain.com`

2. **Backend .env:**
   ```env
   CALLBACK_URL=https://yourdomain.com/api/auth/twitter/callback
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

## 6. Security Notes

- **Never commit `.env` file** to version control
- Use environment variables in production
- Regenerate session secret for production
- Use HTTPS in production
- Enable secure cookies in production

## Need Help?

If you're still experiencing issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify all URLs match exactly
4. Ensure your X Developer account is in good standing
5. Try regenerating your API keys

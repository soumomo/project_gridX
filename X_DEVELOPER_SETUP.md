# X Developer App Configuration Guide

Follow these steps to set up your X (Twitter) Developer App for the Split & Post application.

## Step 1: Create X Developer Account

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal)
2. Sign in with your X account
3. Apply for a developer account (if you don't have one)
4. Wait for approval (this can take a few hours to days)

## Step 2: Create a New App

1. Once approved, go to your [Developer Dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create App" or "Add App"
3. Fill out the app details:
   - **App Name**: `Split and Post App` (or your preferred name)
   - **App Description**: `Web app for splitting images and posting to X`
   - **Website URL**: `http://localhost:3000`
   - **App Usage**: Select appropriate use case

## Step 3: Configure Authentication Settings

1. In your app dashboard, click on your app name
2. Go to the "Settings" tab
3. Scroll down to "Authentication settings"
4. Click "Edit" next to "Authentication settings"

### OAuth 2.0 Configuration:
- **OAuth 2.0**: Enable this option
- **Type of App**: Select "Web App"
- **Callback URI / Redirect URL**: 
  ```
  http://localhost:5000/api/auth/twitter/callback
  ```
- **Website URL**: 
  ```
  http://localhost:3000
  ```

### Important Notes:
- Make sure the callback URL is **exactly** as shown above
- The callback URL must be HTTP (not HTTPS) for local development
- For production, you'll need to update these URLs to your actual domain

## Step 4: Get Your API Keys

1. Go to the "Keys and Tokens" tab
2. Under "OAuth 2.0 Client ID and Client Secret":
   - Copy the **Client ID**
   - Copy the **Client Secret** (click "Show" to reveal it)

## Step 5: Configure Environment Variables

1. Navigate to the `backend` folder of your project
2. Open the `.env` file
3. Replace the placeholder values:

```env
TWITTER_CLIENT_ID="your_actual_client_id_here"
TWITTER_CLIENT_SECRET="your_actual_client_secret_here"
SESSION_SECRET="your_long_random_string_here"
```

### Example:
```env
TWITTER_CLIENT_ID="bVFzeTFKbm1iOXFKVGRHVm1XOW06MTpjaQ"
TWITTER_CLIENT_SECRET="yKyh8D8Dj5FoY7Dt5cQnK8SLF2eQgG9FpV6jY5hJ2nP7sR8kL9"
SESSION_SECRET="my-super-secret-session-key-that-is-very-long-and-random-123456789"
```

## Step 6: App Permissions

Make sure your app has the following permissions (this should be set automatically):
- **Read** tweets
- **Write** tweets
- **Read** users

## Step 7: Rate Limits

Be aware of X API rate limits:
- **Media uploads**: 300 requests per 15-minute window
- **Tweet creation**: 300 requests per 15-minute window
- For development, these limits should be sufficient

## Troubleshooting

### Common Issues:

1. **"Invalid callback URL" error**:
   - Double-check the callback URL in your X app settings
   - Ensure it matches exactly: `http://localhost:5000/api/auth/twitter/callback`

2. **"App not authorized" error**:
   - Make sure OAuth 2.0 is enabled
   - Verify your Client ID and Client Secret are correct

3. **"Authentication failed" error**:
   - Check your `.env` file for correct credentials
   - Restart your backend server after updating `.env`

4. **CORS errors**:
   - Ensure your website URL is set to `http://localhost:3000`
   - Check that both frontend and backend servers are running

### Testing Your Setup:

1. Start your backend server: `cd backend && npm start`
2. Start your frontend server: `cd frontend && npm start`
3. Go to `http://localhost:3000`
4. Click "Login with X"
5. You should be redirected to X for authorization

## Production Deployment

For production deployment, you'll need to:

1. Update callback URL to your production domain
2. Update website URL to your production domain
3. Use HTTPS for all URLs
4. Set secure session cookies (`secure: true`)
5. Use environment variables for all sensitive data

## Security Best Practices

- Never commit your `.env` file to version control
- Use long, random strings for session secrets
- Regularly rotate your API keys
- Monitor your app's usage in the X Developer Portal
- Follow X's API Terms of Service

---

For more detailed information, visit the [X API Documentation](https://developer.twitter.com/en/docs).

# Google OAuth 2.0 Setup Guide

## Overview

ProjectOps now supports Google OAuth 2.0 authentication alongside the existing email/password login. This guide walks you through setting up Google OAuth credentials.

## Security Architecture

### Secure Exchange Code Flow

This implementation uses a **secure exchange code pattern** instead of exposing JWT tokens in URLs:

1. User clicks "Continue with Google" → Backend initiates OAuth flow
2. Google consent screen → User approves
3. Google callback → Backend receives Google profile
4. Backend creates/finds user → Generates **short-lived exchange code** (60s, single-use)
5. Backend redirects to frontend with exchange code (NOT the JWT)
6. Frontend extracts exchange code → Sends POST request to exchange endpoint
7. Backend validates code → Returns actual JWT token
8. Frontend stores JWT using existing auth mechanism

**Why this approach?**
- JWT tokens are never exposed in URLs (browser history, referrer headers, server logs)
- Exchange codes are cryptographically random, expire in 60 seconds, and are single-use
- Prevents token leakage through URL-based attacks

### Account Protection

**Google OAuth will NOT auto-link to existing password accounts:**
- If a Google email matches an existing email/password account, login is blocked
- Error message: "An account with this email already exists. Please sign in with your password."
- This prevents Google account takeover attacks
- Future: Explicit account linking can be added with password verification

### Role Security

**Google OAuth never determines user roles:**
- All new Google users get the default role: `MEMBER`
- Google profile data (claims, groups, etc.) is ignored for authorization
- Admin roles can only be assigned through your application's authorization system

## Setup Instructions

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `ProjectOps` (or your preferred name)
   
5. Configure Authorized redirect URIs:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   
   For production, add your production domain:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

6. Click "Create"
7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure Environment Variables

Add your Google OAuth credentials to `d:\ProjectOps\.env.local`:

```bash
# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**⚠️ IMPORTANT:**
- Replace `CONFIGURE_YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
- Replace `CONFIGURE_YOUR_GOOGLE_CLIENT_SECRET` with your actual Client Secret
- Never commit `.env.local` to git (it's already in `.gitignore`)

### Step 3: Restart Backend

The backend will automatically restart with nodemon if it's running. Otherwise:

```bash
cd d:\ProjectOps\backend
npm run dev
```

You should see:
```
✓ Google OAuth configured
✓ Database connected successfully
🚀 ProjectOps API Server
```

If credentials are missing or invalid, you'll see:
```
ℹ Google OAuth not configured (credentials missing in .env.local)
  Email/password authentication will work normally
```

### Step 4: Test Google Login

1. Navigate to `http://localhost:5173/login`
2. You should see:
   - Email/password form (existing)
   - "Or continue with" divider
   - "Continue with Google" button
3. Click "Continue with Google"
4. Google consent screen should appear
5. After approval, you'll be redirected back and logged in

## Database Schema Changes

The migration `007_add_google_auth.sql` added:

```sql
-- New column for Google user IDs
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Make password_hash nullable (Google users won't have passwords)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Ensure at least one auth method exists
ALTER TABLE users ADD CONSTRAINT users_auth_method_check 
CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL);

-- Index for OAuth lookups
CREATE INDEX idx_users_google_id ON users(google_id);
```

## API Endpoints

### New OAuth Endpoints

#### Initiate Google OAuth
```
GET /api/auth/google
```
Redirects to Google consent screen. No authentication required.

#### Google OAuth Callback
```
GET /api/auth/google/callback?code=<google_oauth_code>
```
Internal endpoint - Google redirects here after user consent. 
Not called directly by frontend.

#### Exchange Code for Token
```
POST /api/auth/google/exchange
Content-Type: application/json

{
  "code": "short-lived-exchange-code"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@gmail.com",
      "role": "MEMBER",
      "google_id": "1234567890"
    }
  }
}
```

### Existing Endpoints (Unchanged)

```
POST /api/auth/register  - Email/password registration
POST /api/auth/login     - Email/password login
GET  /api/auth/me        - Get current user (JWT required)
```

## Frontend Components

### Login Page (`frontend/src/pages/auth/Login.jsx`)
- Existing email/password form preserved
- Added "Continue with Google" button with official Google branding
- Visual divider separating authentication methods

### OAuth Callback (`frontend/src/pages/auth/GoogleCallback.jsx`)
- Handles exchange code extraction from URL
- Exchanges code for JWT token
- Stores token using existing authentication mechanism
- Error handling for expired codes and account conflicts
- Loading states and success feedback

### Routing (`frontend/src/App.jsx`)
- Added `/auth/callback` route for OAuth completion
- Route is public (not wrapped in AuthLayout)

## Testing Checklist

### Email/Password Authentication (Existing)
- [ ] Register new account with email/password
- [ ] Login with email/password
- [ ] Access protected routes after login
- [ ] Logout functionality
- [ ] `/auth/me` endpoint returns user data

### Google OAuth Authentication (New)
- [ ] "Continue with Google" button appears on login page
- [ ] Clicking button redirects to Google consent screen
- [ ] Approving consent redirects back to app
- [ ] New Google user is created with MEMBER role
- [ ] Existing Google user can log in
- [ ] JWT token is stored in localStorage
- [ ] Protected routes work with Google-authenticated users
- [ ] `/auth/me` returns correct user data

### Security Tests
- [ ] JWT token never appears in browser URL
- [ ] Exchange code expires after 60 seconds
- [ ] Exchange code is single-use (second attempt fails)
- [ ] Google login blocked if email exists with password
- [ ] New Google users get MEMBER role (not admin)
- [ ] Existing admin users remain admin

## Troubleshooting

### "Google OAuth not configured" message
**Cause:** Google credentials missing or invalid in `.env.local`

**Solution:** 
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Ensure values are not still set to `CONFIGURE_YOUR_GOOGLE_CLIENT_ID`
3. Restart backend after updating `.env.local`

### "redirect_uri_mismatch" error
**Cause:** Callback URL not authorized in Google Console

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add `http://localhost:5000/api/auth/google/callback` to Authorized redirect URIs
4. Save changes

### "Invalid or expired exchange code"
**Cause:** Exchange code expired (60s TTL) or already used

**Solution:**
- This is normal if user waits too long on callback page
- User should return to login and try again
- Code is single-use for security

### "An account with this email already exists"
**Cause:** Google email matches existing password account

**Solution:**
- This is intentional security behavior
- User should sign in with their password
- Future: Account linking flow can be added

## Production Deployment

### Environment Variables
Add to production environment:
```bash
GOOGLE_CLIENT_ID=prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

### Google Cloud Console
1. Add production callback URL to Authorized redirect URIs
2. Consider creating separate OAuth client for production
3. Enable OAuth consent screen for external users
4. Configure branding (app logo, privacy policy, terms of service)

### Security Considerations
- Always use HTTPS in production
- Keep `GOOGLE_CLIENT_SECRET` secure (use secrets manager)
- Monitor OAuth usage and rate limits
- Implement rate limiting on exchange endpoint
- Consider adding CSRF protection
- Regularly rotate credentials

## Implementation Files

### Backend
- `database/migrations/007_add_google_auth.sql` - Database schema changes
- `backend/src/config/passport.js` - Passport Google OAuth strategy
- `backend/src/utils/exchangeCodeStore.js` - Secure exchange code store
- `backend/src/controllers/googleAuthController.js` - OAuth flow controller
- `backend/src/controllers/exchangeController.js` - Token exchange endpoint
- `backend/src/services/authService.js` - findOrCreateGoogleUser with protection
- `backend/src/repositories/userRepository.js` - Google user methods
- `backend/src/routes/authRoutes.js` - OAuth routes

### Frontend
- `frontend/src/pages/auth/Login.jsx` - Google login button
- `frontend/src/pages/auth/GoogleCallback.jsx` - OAuth callback handler
- `frontend/src/App.jsx` - OAuth callback routing

## Support

For issues or questions:
1. Check backend logs for detailed error messages
2. Verify environment variables are correctly set
3. Test existing email/password login to isolate OAuth issues
4. Review Google Cloud Console for OAuth client configuration

---

**Documentation Version:** 1.0.0  
**Last Updated:** October 2026  
**Compatible with:** ProjectOps v1.0.0+

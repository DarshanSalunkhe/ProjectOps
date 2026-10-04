import passport from '../config/passport.js';
import { authService } from '../services/authService.js';
import { exchangeCodeStore } from '../utils/exchangeCodeStore.js';
import config from '../config/index.js';

/**
 * Google OAuth Controller
 * Handles Google OAuth 2.0 authentication flow with secure exchange code pattern
 */

/**
 * Initiate Google OAuth flow
 * Redirects user to Google consent screen
 */
export const initiateGoogleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

/**
 * Handle Google OAuth callback
 * Receives Google profile, finds/creates user, generates exchange code
 * Redirects to frontend with short-lived exchange code (NOT the JWT)
 */
export const handleGoogleCallback = [
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=oauth_failed`
  }),
  async (req, res, next) => {
    try {
      console.log('[OAuth Callback] Callback route reached');
      
      // Google profile from passport strategy
      const googleProfile = req.user;
      
      if (!googleProfile) {
        console.log('[OAuth Callback] ERROR: No user profile received from Google');
        return res.redirect(`${config.frontendUrl}/login?error=no_profile`);
      }
      
      console.log('[OAuth Callback] Google profile received:', {
        hasGoogleId: !!googleProfile.googleId,
        hasEmail: !!googleProfile.email,
        hasName: !!googleProfile.name
      });

      // Find or create user (with account protection)
      console.log('[OAuth Callback] Attempting to find/create user');
      const user = await authService.findOrCreateGoogleUser(googleProfile);
      
      console.log('[OAuth Callback] User processed:', {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        hasGoogleId: !!user.google_id
      });

      // Generate short-lived exchange code (60 seconds, single-use)
      const exchangeCode = exchangeCodeStore.create(user.id);
      console.log('[OAuth Callback] Exchange code generated (length:', exchangeCode.length, ')');

      // Redirect to frontend with exchange code (NOT the JWT token)
      // Frontend will exchange this code for the actual JWT
      const redirectUrl = `${config.frontendUrl}/auth/callback?code=${exchangeCode}`;
      
      console.log('[OAuth Callback] Redirecting to frontend callback');
      res.redirect(redirectUrl);
    } catch (error) {
      console.log('[OAuth Callback] ERROR:', error.message);
      console.log('[OAuth Callback] Error stack:', error.stack);
      next(error);
    }
  }
];

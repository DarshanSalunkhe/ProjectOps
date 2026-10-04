import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index.js';

/**
 * Configure Passport with Google OAuth 2.0 strategy
 * Uses environment variables for credentials and callback URL
 */
export const configurePassport = () => {
  // Only configure Google OAuth if credentials are provided
  if (config.googleClientId && 
      config.googleClientSecret && 
      config.googleClientId !== 'CONFIGURE_YOUR_GOOGLE_CLIENT_ID') {
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.googleClientId,
          clientSecret: config.googleClientSecret,
          callbackURL: config.googleCallbackUrl,
          scope: ['profile', 'email']
        },
        (accessToken, refreshToken, profile, done) => {
          console.log('[Passport Strategy] Google profile received');
          console.log('[Passport Strategy] Profile ID exists:', !!profile.id);
          console.log('[Passport Strategy] Profile emails exists:', !!profile.emails);
          console.log('[Passport Strategy] Profile displayName:', profile.displayName);
          
          // Extract relevant user information from Google profile
          const googleProfile = {
            googleId: profile.id,
            email: profile.emails[0]?.value,
            name: profile.displayName || profile.name?.givenName || 'User',
            profilePhoto: profile.photos[0]?.value
          };
          
          console.log('[Passport Strategy] Extracted profile:', {
            hasGoogleId: !!googleProfile.googleId,
            hasEmail: !!googleProfile.email,
            hasName: !!googleProfile.name
          });
          
          // Pass profile to the callback handler
          // The actual user creation/lookup happens in the controller
          return done(null, googleProfile);
        }
      )
    );

    console.log('✓ Google OAuth configured');
  } else {
    console.log('ℹ Google OAuth not configured (credentials missing in .env.local)');
    console.log('  Email/password authentication will work normally');
    console.log('  To enable Google login, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  }

  // Passport serialization (not needed for JWT-based auth, but required by passport)
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

export default passport;

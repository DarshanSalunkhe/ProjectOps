import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Google OAuth Callback Handler
 * Receives short-lived exchange code from backend, exchanges it for JWT token
 * Uses existing authentication mechanism to complete login
 */
const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('processing');
  
  // Guard against React StrictMode double-execution
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Prevent duplicate exchange attempts (React StrictMode protection)
      if (exchangeAttempted.current) {
        console.log('[Frontend OAuth Callback] Exchange already attempted, skipping duplicate');
        return;
      }
      
      exchangeAttempted.current = true;
      
      try {
        console.log('[Frontend OAuth Callback] Component mounted');
        console.log('[Frontend OAuth Callback] Current URL:', window.location.href);
        
        // Extract exchange code from URL (use current searchParams)
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        console.log('[Frontend OAuth Callback] URL params:', {
          hasCode: !!code,
          codeLength: code?.length,
          hasError: !!errorParam,
          errorValue: errorParam
        });

        // Check for OAuth errors
        if (errorParam) {
          console.log('[Frontend OAuth Callback] ERROR: OAuth error parameter present');
          setError('Google authentication failed. Please try again.');
          setStatus('error');
          return;
        }

        if (!code) {
          console.log('[Frontend OAuth Callback] ERROR: No code in URL');
          setError('No authentication code received. Please try again.');
          setStatus('error');
          return;
        }

        console.log('[Frontend OAuth Callback] Starting exchange request');
        setStatus('exchanging');

        // Exchange code for JWT token
        const response = await api.post('/auth/google/exchange', { code });
        
        // Note: api interceptor returns response.data, so 'response' here is already unwrapped once
        console.log('[Frontend OAuth Callback] Exchange response received:', {
          hasSuccess: !!response.success,
          hasData: !!response.data,
          hasToken: !!response.data?.token,
          hasUser: !!response.data?.user
        });

        if (!response.success) {
          throw new Error('Token exchange failed');
        }

        // Response structure after interceptor: { success: true, data: { token, user }, message }
        const { token, user } = response.data;
        console.log('[Frontend OAuth Callback] Token and user received:', {
          hasToken: !!token,
          hasUser: !!user,
          userId: user?.id
        });

        // Store token in localStorage (existing auth mechanism)
        localStorage.setItem('token', token);
        console.log('[Frontend OAuth Callback] Token stored in localStorage');

        // Update AuthContext state
        setToken(token);
        setUser(user);
        console.log('[Frontend OAuth Callback] AuthContext updated');

        setStatus('success');

        // Clean up: Remove code from URL to prevent accidental reuse
        window.history.replaceState({}, document.title, '/auth/callback');
        console.log('[Frontend OAuth Callback] Exchange code removed from URL');

        // Redirect to dashboard
        console.log('[Frontend OAuth Callback] Redirecting to dashboard in 500ms');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);

      } catch (err) {
        console.error('[Frontend OAuth Callback] ERROR:', err);
        console.error('[Frontend OAuth Callback] Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        if (err.response?.status === 401) {
          setError('Authentication code expired. Please try logging in again.');
        } else if (err.response?.status === 409) {
          setError(err.response.data.message || 'An account with this email already exists.');
        } else {
          setError('Authentication failed. Please try again.');
        }
        
        setStatus('error');
      }
    };

    handleOAuthCallback();
    // Dependencies: searchParams triggers re-run if URL params change
    // navigate, setUser, setToken are now stable (memoized/from useState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authenticating with Google
            </h2>
            <p className="text-gray-600">Please wait...</p>
          </>
        )}

        {status === 'exchanging' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Sign In
            </h2>
            <p className="text-gray-600">Setting up your account...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;

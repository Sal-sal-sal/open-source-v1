import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { trackRegistration, trackLogin, trackError } from '../utils/analytics';

interface GoogleLoginButtonProps {
  onSuccess?: (token: string, isNewUser?: boolean) => void;
  onError?: (error: string) => void;
  mode?: 'login' | 'register';
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  mode = 'login',
  className = ''
}) => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSuccess = async (credentialResponse: any) => {
    try {
      console.log('Google login successful, ID token received');
      
      // Send ID token to backend
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Google authentication failed');
      }

      const data = await res.json();
      
      // Track the event based on whether this is a new user or existing user
      if (data.is_new_user) {
        trackRegistration('google');
      } else {
        trackLogin('google');
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(data.access_token, data.is_new_user);
      }

    } catch (error) {
      console.error('Google authentication error:', error);
      trackError('google_auth_failed', error instanceof Error ? error.message : 'Unknown error');
      
      if (onError) {
        onError(error instanceof Error ? error.message : 'Authentication failed');
      }
    }
  };

  const handleError = () => {
    console.error('Google login error');
    trackError('google_oauth_error', 'Google login failed');
    
    if (onError) {
      onError('Google login failed. Please try again.');
    }
  };

  // If Google OAuth is not configured, show disabled button
  if (!googleClientId || googleClientId === 'dummy-client-id') {
    return (
      <button
        disabled
        className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-sm font-medium text-gray-500 cursor-not-allowed ${className}`}
        title="Google OAuth not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file."
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'} (Not Configured)
      </button>
    );
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap
      theme="outline"
      size="large"
      text={mode === 'register' ? 'signup_with' : 'signin_with'}
      shape="rectangular"
      width="100%"
      className={className}
    />
  );
};

export default GoogleLoginButton; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth';
import { trackRegistration, trackError } from '../utils/analytics';
import GoogleLoginButton from '../components/GoogleLoginButton';

/// <reference types="vite/client" />
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed');
      }
      const data = await res.json();
      setToken(data.access_token, data.refresh_token);
      
      // Track successful registration
      trackRegistration('email');
      
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
      // Track registration error
      trackError('registration_failed', err.message);
    }
  };

  const handleGoogleSuccess = (token: string, isNewUser?: boolean) => {
    // Extract username from token or use a default
    const username = 'google_user'; // You might want to get this from the token or user info
    setToken(username, token);
    
    // Broadcast login event
    const channel = new BroadcastChannel('auth');
    channel.postMessage('login');
    channel.close();

    // Show welcome message for new users
    if (isNewUser) {
      // You could show a toast or redirect to a welcome page
      console.log('Welcome new Google user!');
    }

    navigate('/audio');
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 focus:outline-none"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 focus:outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 focus:outline-none"
          required
        />
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-2 rounded">
          Sign Up
        </button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
          </div>
        </div>
        
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          mode="register"
          className="text-black"
        />
        
        <p className="text-center text-sm text-gray-400">
          Already have an account? <a href="/login" className="text-cyan-400">Sign In</a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;

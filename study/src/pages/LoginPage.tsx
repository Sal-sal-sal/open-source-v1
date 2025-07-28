import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth';
import { trackLogin, trackError } from '../utils/analytics';
import GoogleLoginButton from '../components/GoogleLoginButton';

/// <reference types="vite/client" />
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }
      const data = await res.json();
      setToken(username, data.access_token);
      
      // Track successful login
      trackLogin('email');
      
      // Broadcast login event
      const channel = new BroadcastChannel('auth');
      channel.postMessage('login');
      channel.close();

      navigate('/audio');
    } catch (err: any) {
      setError(err.message);
      // Track login error
      trackError('login_failed', err.message);
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
    <div 
      className="flex items-center justify-center h-screen bg-gray-900 text-white relative"
      style={{
        backgroundImage: 'url(/resurses/for_log_in.gif)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay для улучшения читаемости */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800/90 backdrop-blur-sm p-8 rounded-lg w-full max-w-sm space-y-4 relative z-10 border border-gray-700"
      >
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 rounded bg-gray-700/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-2 rounded font-semibold transition-colors">
          Sign In
        </button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800/90 text-gray-400">Or continue with</span>
          </div>
        </div>
        
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          mode="login"
          className="text-black"
        />
        
        <p className="text-center text-sm text-gray-400">
          No account? <a href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">Sign Up</a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage; 
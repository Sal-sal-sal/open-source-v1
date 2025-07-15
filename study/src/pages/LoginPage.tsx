import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth';

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
      
      // Broadcast login event
      const channel = new BroadcastChannel('auth');
      channel.postMessage('login');
      channel.close();

      navigate('/chat');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
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
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 focus:outline-none"
          required
        />
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-2 rounded">
          Sign In
        </button>
        <p className="text-center text-sm text-gray-400">
          No account? <a href="/register" className="text-cyan-400">Sign Up</a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage; 
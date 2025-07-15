import React, { useState } from 'react';

// Firebase Realtime Database base URL (can be overridden via Vite env var)
const FIREBASE_URL = import.meta.env.VITE_FIREBASE_URL || 'https://landing-44432-default-rtdb.firebaseio.com';

interface RegistrationFormProps {
    onSuccess?: (message: string) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const response = await fetch(`${FIREBASE_URL}/users.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (response.ok) {
            const successMessage = 'Registration successful!';
            setSuccess(successMessage);
            setUsername('');
            setEmail('');
            setPassword('');
            
            // Call the onSuccess callback if provided
            if (onSuccess) {
                onSuccess(successMessage);
            }
        } else {
            const errorData = await response.json();
            setError(errorData.detail || 'Registration failed. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="username">Username:</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <button type="submit">Register</button>
        </form>
    );
};

export default RegistrationForm;
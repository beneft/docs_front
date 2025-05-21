import React, {useEffect, useState} from 'react';
import '../styles/Login.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            await login(data);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="auth-container">
            <a className="back" href="/">Back to main page</a>
            <h2>Welcome Back</h2>
            <form className="auth-form" onSubmit={handleLogin}>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                />

                {error && <div className="auth-error">{error}</div>}

                <button type="submit">Login</button>
            </form>
            <p className="auth-footer">
                Don’t have an account? <a href="/register">Register here</a>
            </p>
        </div>
    );
};

export default Login;
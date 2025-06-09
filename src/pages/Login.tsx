import React, {useEffect, useState} from 'react';
import '../styles/Login.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isRestoreMode, setIsRestoreMode] = useState(false);
    const [restoreSent, setRestoreSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) throw new Error('Invalid credentials');

            const data = await response.json();
            await login(data);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    const handleRestore = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) throw new Error('Failed to send restore link');

            setRestoreSent(true);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Restore failed');
        }
    };

    return (
        <div className="auth-container">
            <a className="back" href="/">Back to main page</a>
            <h2>{isRestoreMode ? 'Restore Password' : 'Welcome Back'}</h2>

            {!isRestoreMode ? (
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

                    <p className="auth-footer">
                        Don’t have an account? <a href="/register">Register here</a><br/>
                        Forgot password? <button
                        type="button"
                        className="auth-link-button"
                        onClick={() => {
                            setError(null);
                            setIsRestoreMode(true);
                        }}
                    >Restore password</button>
                    </p>
                </form>
            ) : (
                <form className="auth-form" onSubmit={handleRestore}>
                    {!restoreSent ? (
                        <>
                            <label>Enter your email to restore password</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                            {error && <div className="auth-error">{error}</div>}
                            <button type="submit">Send Restore Link</button>
                        </>
                    ) : (
                        <>
                            <p className="auth-success">✅ A restore link has been sent to your email.</p>
                            <button type="button" onClick={() => {
                                setIsRestoreMode(false);
                                setRestoreSent(false);
                                setEmail('');
                            }}>Back to Login</button>
                        </>
                    )}
                </form>
            )}
        </div>
    );
};

export default Login;
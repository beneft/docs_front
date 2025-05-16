import React from 'react';
import '../styles/Login.css';

const Login: React.FC = () => {
    return (
        <div className="auth-container">
            <a className="back" href="/">Back to main page</a>
            <h2>Welcome Back</h2>
            <form className="auth-form">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" required />

                <label>Password</label>
                <input type="password" placeholder="Enter password" required />

                <button type="submit">Login</button>
            </form>
            <p className="auth-footer">
                Don’t have an account? <a href="/register">Register here</a>
            </p>
        </div>
    );
};

export default Login;
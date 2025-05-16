import React from 'react';
import '../styles/Register.css';

const Register: React.FC = () => {
    return (
        <div className="auth-container">
            <a className="back" href="/">Back to main page</a>
            <h2>Create Your Account</h2>
            <form className="auth-form">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" required />

                <label>Password</label>
                <input type="password" placeholder="Enter password" required />

                <label>Confirm Password</label>
                <input type="password" placeholder="Repeat password" required />

                <button type="submit">Register</button>
            </form>
            <p className="auth-footer">
                Already have an account? <a href="/login">Login here</a>
            </p>
        </div>
    );
};

export default Register;
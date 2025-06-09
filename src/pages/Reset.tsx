import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Register.css';

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError('Invalid or missing token.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('http://localhost:8081/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(body || 'Password reset failed');
            }

            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message || 'Password reset failed');
        }
    };

    return (
        <div className="auth-container">
            <a className="back" href="/">Back to main page</a>
            <h2>Reset Your Password</h2>
            <form className="auth-form" onSubmit={handleReset}>
                <label>New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />

                <label>Confirm New Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">Password updated successfully. Redirecting…</div>}

                <button type="submit">Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;
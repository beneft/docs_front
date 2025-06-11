import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Register.css';
import { useTranslation } from 'react-i18next';

const ResetPassword: React.FC = () => {
    const { t } = useTranslation('reset');
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
            setError(t('errorMissingToken'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('errorMismatch'));
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
                throw new Error(body || t('errorResetFailed'));
            }

            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.message || t('errorResetFailed'));
        }
    };

    return (
        <div className="auth-container">
            <a className="back" href="/">{t('back')}</a>
            <h2>{t('title')}</h2>
            <form className="auth-form" onSubmit={handleReset}>
                <label>{t('newPassword')}</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />

                <label>{t('confirmPassword')}</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{t('success')}</div>}

                <button type="submit">{t('reset')}</button>
            </form>
        </div>
    );
};

export default ResetPassword;
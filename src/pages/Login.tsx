import React, { useEffect, useState } from 'react';
import '../styles/Login.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
    const { t } = useTranslation('login');
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

            if (!response.ok) throw new Error(t('errorInvalidCredentials'));

            const data = await response.json();
            await login(data);
            navigate('/');
        } catch (err: any) {
            setError(err.message || t('errorLoginFailed'));
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

            if (!response.ok) throw new Error(t('errorRestoreFailed'));

            setRestoreSent(true);
            setError(null);
        } catch (err: any) {
            setError(err.message || t('errorRestoreFailed'));
        }
    };

    return (
        <div className="auth-container">
            <a className="back" href="/">{t('back')}</a>
            <h2>{isRestoreMode ? t('restoreTitle') : t('loginTitle')}</h2>

            {!isRestoreMode ? (
                <form className="auth-form" onSubmit={handleLogin}>
                    <label>{t('email')}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                    />

                    <label>{t('password')}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder={t('passwordPlaceholder')}
                    />

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit">{t('login')}</button>

                    <p className="auth-footer">
                        {t('noAccount')} <a href="/register">{t('register')}</a><br />
                        {t('forgot')} <button
                        type="button"
                        className="auth-link-button"
                        onClick={() => {
                            setError(null);
                            setIsRestoreMode(true);
                        }}
                    >{t('restore')}</button>
                    </p>
                </form>
            ) : (
                <form className="auth-form" onSubmit={handleRestore}>
                    {!restoreSent ? (
                        <>
                            <label>{t('restoreInstruction')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                            {error && <div className="auth-error">{error}</div>}
                            <button type="submit">{t('sendRestore')}</button>
                        </>
                    ) : (
                        <>
                            <p className="auth-success">✅ {t('restoreSuccess')}</p>
                            <button type="button" onClick={() => {
                                setIsRestoreMode(false);
                                setRestoreSent(false);
                                setEmail('');
                            }}>{t('backToLogin')}</button>
                        </>
                    )}
                </form>
            )}
        </div>
    );
};

export default Login;
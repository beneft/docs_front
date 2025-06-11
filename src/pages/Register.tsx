import React, { useState } from 'react';
import '../styles/Register.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('register');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [organization, setOrganization] = useState('');
    const [position, setPosition] = useState('');
    const [phone, setPhone] = useState('');
    const [iin, setIin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateEmail(email)) {
            setError(t('err-invalid-email'));
            return;
        }

        if (password.length < 6) {
            setError(t('err-short-password'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('err-pass-do-not-match'));
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8081/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    firstName,
                    lastName,
                    organization,
                    position,
                    phone,
                    iin
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.message || t('err-register-failed'));
            }

            alert(t('register-success'));
            navigate('/');
        } catch (err: any) {
            setError(err.message || t('err-register-failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <a className="back" href="/">{t('back')}</a>
            <h2>{t('create-header')}</h2>
            <form className="auth-form" onSubmit={handleRegister}>
                <label>{t('fname')}</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />

                <label>{t('lname')}</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />

                <label>{t('email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                <label>{t('password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                <label>{t('confirm-password')}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

                <label>{t('organization')} <span className="optional">({t('optional')})</span></label>
                <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} />

                <label>{t('position')} <span className="optional">({t('optional')})</span></label>
                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} />

                <label>{t('phone')} <span className="optional">({t('optional')})</span></label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />

                <label>{t('iin')} <span className="optional">({t('optional')})</span></label>
                <input type="text" value={iin} onChange={(e) => setIin(e.target.value)} />

                {error && <div className="auth-error">{error}</div>}
                <button type="submit" disabled={loading}>
                    {loading ? t('loading') + '...' : t('register-button')}
                </button>
            </form>
            <p className="auth-footer">
                {t('already-have-account')} <a href="/login">{t('login-here')}</a>
            </p>
        </div>
    );
};

export default Register;
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TwoFactorPage: React.FC = () => {
    const [params] = useSearchParams();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation('2fa');
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const token = params.get('token');
        const email = localStorage.getItem('pending2FAEmail');

        if (!token || !email) {
            setError(t('2fa.missingParams'));
            return;
        }

        const confirm2FA = async () => {
            try {
                const response = await fetch(`http://localhost:8081/api/auth/2fa/confirm?token=${token}&email=${email}`, {
                    method: 'POST',
                });

                if (!response.ok) throw new Error(t('2fa.invalidToken'));

                const data = await response.json();
                localStorage.removeItem('pending2FAEmail');
                await login(data);
                navigate('/');
            } catch (err: any) {
                setError(err.message || t('2fa.verificationFailed'));
            }
        };

        confirm2FA();
    }, [params, login, navigate, t]);

    return (
        <div className="auth-container">
            {error ? (
                <p className="auth-error">{error}</p>
            ) : (
                <p>{t('2fa.verifying')}</p>
            )}
        </div>
    );
};

export default TwoFactorPage;
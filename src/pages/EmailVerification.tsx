import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/EmailVerification.css';

const EmailVerification: React.FC = () => {
    const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [message, setMessage] = useState('');
    const [searchParams] = useSearchParams();
    const { t } = useTranslation('email-verify');
    const navigate = useNavigate();
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const code = searchParams.get('code');
        if (!code) {
            setStatus('failed');
            setMessage(t('no-code'));
            return;
        }

        fetch(`http://localhost:8081/api/email/confirm?code=${code}`)
            .then(async res => {
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    setStatus('success');
                    setMessage(data.message);
                } else {
                    setStatus('failed');
                    setMessage(data.message || t('failed'));
                }
            })
            .catch(() => {
                setStatus('failed');
                setMessage(t('network-error'));
            });
    }, [searchParams, t]);

    return (
        <div className="email-verify-container">
            {status === 'pending' && <p className="email-verify-message">{t('verifying')}</p>}
            {status === 'success' && (
                <div className="email-verify-success">
                    <p className="email-verify-message">{message}</p>
                    <button className="email-verify-button" onClick={() => navigate('/login')}>
                        {t('go-to-login')}
                    </button>
                </div>
            )}
            {status === 'failed' && (
                <div className="email-verify-failed">
                    <p className="email-verify-message">{message}</p>
                </div>
            )}
        </div>
    );
};

export default EmailVerification;
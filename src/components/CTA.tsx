import React from 'react';
import './CTA.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CTA: React.FC = () => {
    const { t } = useTranslation('home');

    return (
        <section className="cta">
            <Link to="/register" className="register-button">{t('create-account')}</Link>
            <p className="small-text">{t('no-cc')}</p>
        </section>
    );
};

export default CTA;
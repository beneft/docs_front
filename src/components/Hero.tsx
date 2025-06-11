import React from 'react';
import './Hero.css';
import { useTranslation } from 'react-i18next';

const Hero: React.FC = () => {
    const { t } = useTranslation('home');

    return (
        <section className="hero">
            <h1>{t('hero-title')}</h1>
            <p>{t('hero-subtitle')}</p>
        </section>
    );
};

export default Hero;
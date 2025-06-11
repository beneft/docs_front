import React from 'react';
import './Footer.css';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation('home');

    return (
        <footer className="footer">
            <p>{t('copyright')}</p>
        </footer>
    );
};

export default Footer;
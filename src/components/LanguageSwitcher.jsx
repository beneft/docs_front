import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const toggleLanguage = () => {
        const newLang = currentLang === 'ru' ? 'en' : 'ru';
        i18n.changeLanguage(newLang);
    };

    return (
        <button className="lang-switcher" onClick={toggleLanguage}>
            {currentLang === 'ru' ? '🇺🇸' : '🇷🇺'}
        </button>
    );
};

export default LanguageSwitcher;
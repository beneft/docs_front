import React from 'react';
import './Features.css';
import { useTranslation } from 'react-i18next';

const Features: React.FC = () => {
    const { t } = useTranslation('home');

    return (
        <section className="features">
            <div className="feature">
                <div className="icon">🖊️</div>
                <h3>{t('multi-sign-title')}</h3>
                <p>{t('multi-sign-desc')}</p>
            </div>
            <div className="feature">
                <div className="icon">🔁</div>
                <h3>{t('sequential-title')}</h3>
                <p>{t('sequential-desc')}</p>
            </div>
            <div className="feature">
                <div className="icon">📝</div>
                <h3>{t('template-title')}</h3>
                <p>{t('template-desc')}</p>
            </div>
        </section>
    );
};

export default Features;
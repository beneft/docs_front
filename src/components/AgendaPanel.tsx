import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AgendaPanel.css';
import { useTranslation } from 'react-i18next';

const AgendaPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation('home');

    return (
        <div className={`agenda-panel ${isOpen ? 'open' : ''}`}>
            <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? t('arrow-right') : t('arrow-left')}
            </button>
            <div className="agenda-content">
                <h3>{t('title')}</h3>
                <ul>
                    <li><strong>{t('doc')}:</strong> NDA_Contract.pdf</li>
                    <li><strong>{t('from')}:</strong> HR Dept</li>
                    <li><strong>{t('status')}:</strong> {t('awaiting')}</li>
                    <li><Link to="/profile">{t('go-profile')}</Link></li>
                </ul>
            </div>
        </div>
    );
};

export default AgendaPanel;
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './Navbar.css';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation('home');

    return (
        <nav className="navbar">
            <div className="logo">DocFlow</div>
            <ul className="nav-links">
                <li><Link to="/verify">{t('verify')}</Link></li>
                <li><Link to="/news">{t('news')}</Link></li>
                <li><Link to="/pricing">{t('pricing')}</Link></li>
                <li><Link to="/about">{t('about')}</Link></li>
            </ul>
            <div className="nav-actions">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '' }}>
                    <LanguageSwitcher />
                </div>
                {user ? (
                    <>
                        <span className="logo">{user.firstName} {user.lastName}</span>
                        <Link to="/profile" className="register">{t('profile')}</Link>
                        <button onClick={logout} className="login">{t('logout')}</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="login">{t('login')}</Link>
                        <Link to="/register" className="register">{t('start')}</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
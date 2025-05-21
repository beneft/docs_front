import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="logo">DocFlow</div>
            <ul className="nav-links">
                <li><Link to="/news">News</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/about">About Us</Link></li>
            </ul>
            <div className="nav-actions">
                {user ? (
                    <>
                        <span className="logo">{user.firstName} {user.lastName}</span>
                        <Link to="/profile" className="register">Profile</Link>
                        <button onClick={logout} className="login">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="login">Login</Link>
                        <Link to="/register" className="register">Start for Free</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
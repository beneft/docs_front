import React from 'react';
import './CTA.css';
import { Link } from 'react-router-dom';

const CTA: React.FC = () => {
    return (
        <section className="cta">
            <Link to="/register" className="register-button">Create Free Account</Link>
            <p className="small-text">No credit card required. Cancel anytime.</p>
        </section>
    );
};

export default CTA;
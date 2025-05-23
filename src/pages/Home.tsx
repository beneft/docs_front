import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import AgendaPanel from '../components/AgendaPanel';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home: React.FC = () => {
    const { user , login } = useAuth();

    return (
        <div className="homepage-wrapper">
            <div className="home-content">
                <Navbar />
                {user && <AgendaPanel />}
                <Hero />
                <Features />
                {!user && <CTA />}
            </div>
            <Footer />
        </div>
    );
};

export default Home;
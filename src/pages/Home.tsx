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

    useEffect(() => {
        if (!user) {
            login({ name: 'Test User' });
        }
    }, [user, login]);

    return (
        <>
            <Navbar />
            {user && <AgendaPanel />}
            <Hero />
            <Features />
            <CTA />
            {/* Add promotional sections here later */}
            <Footer />
        </>
    );
};

export default Home;
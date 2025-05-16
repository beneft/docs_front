import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AgendaPanel.css';

const AgendaPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`agenda-panel ${isOpen ? 'open' : ''}`}>
            <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '→' : '←'}
            </button>
            <div className="agenda-content">
                <h3>Your Agenda</h3>
                <ul>
                    <li><strong>Doc:</strong> NDA_Contract.pdf</li>
                    <li><strong>From:</strong> HR Dept</li>
                    <li><strong>Status:</strong> Awaiting Signature</li>
                    <li><Link to="/profile">Go to Profile</Link></li>
                </ul>
            </div>
        </div>
    );
};

export default AgendaPanel;
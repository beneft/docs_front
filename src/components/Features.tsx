import React from 'react';
import './Features.css';

const Features: React.FC = () => {
    return (
        <section className="features">
            <div className="feature">
                <div className="icon">🖊️</div>
                <h3>Multiple Ways to Sign</h3>
                <p>QR codes, apps, and more.</p>
            </div>
            <div className="feature">
                <div className="icon">🔁</div>
                <h3>Sequential & Multi-Signing</h3>
                <p>Assign roles and control the flow.</p>
            </div>
            <div className="feature">
                <div className="icon">📝</div>
                <h3>Templates & Live Editing</h3>
                <p>Create and reuse smart document templates.</p>
            </div>
        </section>
    );
};

export default Features;
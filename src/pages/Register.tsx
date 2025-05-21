import React , {useEffect, useState} from 'react';
import '../styles/Register.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [organization, setOrganization] = useState('');
    const [position, setPosition] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await fetch('http://localhost:8081/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    firstName,
                    lastName,
                    organization,
                    position,
                    phone
                })
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            alert('You have successfully created an account!');
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        }
    };

    return (
        <div className="auth-container">
            <a className="back" href="/">Back to main page</a>
            <h2>Create Your Account</h2>
            <form className="auth-form" onSubmit={handleRegister}>
                <label>First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />

                <label>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />

                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                <label>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

                <label>Organization</label>
                <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} />

                <label>Position</label>
                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} />

                <label>Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />

                {error && <div className="auth-error">{error}</div>}

                <button type="submit">Register</button>
            </form>
            <p className="auth-footer">
                Already have an account? <a href="/login">Login here</a>
            </p>
        </div>
    );
};

export default Register;
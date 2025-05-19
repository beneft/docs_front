import React, {useEffect} from 'react';
import '../styles/Login.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const { user , login } = useAuth();
    const navigate = useNavigate();

    const logUser = (id: number, name: string) => {
        if (!user) {
            login({ id: 666, name: 'bobr kurwa' });
            navigate("/");
        }
    }

    return (
        <div className="auth-container">
            <a className="back" href="/">Back to main page</a>
            <h2>Welcome Back</h2>
            <form className="auth-form">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" required />

                <label>Password</label>
                <input type="password" placeholder="Enter password" required />

                <button type="submit" onClick={() => logUser(666,"")}>Login</button>
            </form>
            <p className="auth-footer">
                Don’t have an account? <a href="/register">Register here</a>
            </p>
        </div>
    );
};

export default Login;
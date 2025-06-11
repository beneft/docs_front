import React, { createContext, useContext, useState, ReactNode } from 'react';

export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organization: string;
    position: string;
    phone: string;
    iin: string;
};

type AuthResponse = {
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    tokenType: string
}

type AuthContextType = {
    user: User | null;
    login: (auth: AuthResponse) => Promise<void>;
    logout: () => void;
    getAccessToken: () => string | null;

    refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    const login = async (auth: AuthResponse) => {

        localStorage.setItem("accessToken", auth.accessToken);

        const res = await fetch("http://localhost:8081/api/profile", {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${auth.accessToken}`
            }
        });

        if (!res.ok) throw new Error("Failed to fetch user profile");

        const user: User = await res.json();

        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
    };

    const refresh = async () => {

        const res = await fetch("http://localhost:8081/api/profile", {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${getAccessToken()}`
            }
        });

        if (!res.ok) throw new Error("Failed to fetch user profile");

        const user: User = await res.json();

        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
    };


    const getAccessToken = (): string | null => {
        return localStorage.getItem("accessToken");
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, getAccessToken, refresh }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (error: any) {
            if (error.response?.status !== 401) {
                console.error("Failed to fetch user", error);
            } else {
                console.warn("Session expired, logging out.");
            }
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = (token: string) => {
        localStorage.setItem('token', token);
        fetchUser();
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

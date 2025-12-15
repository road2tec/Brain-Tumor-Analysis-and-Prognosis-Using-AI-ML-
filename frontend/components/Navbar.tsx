"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Brain, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                    <Brain className="w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight text-white">NeuroScout</span>
                </Link>

                <div className="flex items-center space-x-6">
                    {user ? (
                        <>
                            <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                Dashboard
                            </Link>
                            <div className="flex items-center space-x-4 border-l border-white/10 pl-6">
                                <span className="text-sm text-gray-400 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {user.name}
                                </span>
                                <button
                                    onClick={logout}
                                    className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

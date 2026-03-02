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
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200'
            : 'bg-white shadow-sm border-b border-gray-200'
            }`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2 group">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700 transition-all">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        NeuroScout
                    </span>
                </Link>

                <div className="flex items-center space-x-6">
                    {user ? (
                        <>
                            {/* Role Badge */}
                            {user.role === 'admin' && (
                                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Admin Portal
                                </div>
                            )}
                            {user.role === 'doctor' && (
                                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold uppercase tracking-wider shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    Doctor Portal
                                </div>
                            )}
                            {user.role === 'user' && (
                                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-600 text-xs font-bold uppercase tracking-wider shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Patient Portal
                                </div>
                            )}

                            <Link
                                href={user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/dashboard'}
                                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                Dashboard
                            </Link>

                            {user.role === 'user' && (
                                <Link
                                    href="/my-appointments"
                                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    My Appointments
                                </Link>
                            )}

                            <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${user.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                                            user.role === 'doctor' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
                                                'bg-gradient-to-br from-green-500 to-emerald-500'
                                        }`}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{user.name}</span>
                                </span>
                                <button
                                    onClick={logout}
                                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors border border-transparent hover:border-red-100"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
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

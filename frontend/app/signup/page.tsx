"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Register
            await api.post('/auth/signup', { name, email, password });

            // Auto login
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const res = await api.post('/auth/login', formData);
            login(res.data.access_token);
        } catch (err: any) {
            console.error("Signup Error:", err);
            if (err.response) {
                console.error("Response Data:", err.response.data);
                console.error("Response Status:", err.response.status);
            }
            setError(err.response?.data?.detail || err.message || 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                            <p className="text-gray-600">Join to start analyzing MRI scans</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Sign Up"
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

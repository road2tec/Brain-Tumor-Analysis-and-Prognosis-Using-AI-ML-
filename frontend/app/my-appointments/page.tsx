"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Calendar, Clock, User, Stethoscope, FileText, ChevronLeft } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function MyAppointments() {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await axios.get(`${API_URL}/appointments/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAppointments(res.data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-yellow-100 text-yellow-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">My Appointments</h1>
                        <p className="text-gray-600">View and manage your medical appointments</p>
                    </div>
                    <button
                        onClick={() => router.push("/book-appointment")}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        + Book New Appointment
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-gray-600 text-lg">Loading appointments...</div>
                    </div>
                ) : appointments.length > 0 ? (
                    <div className="grid gap-6">
                        {appointments.map((apt: any) => (
                            <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg border border-gray-200 p-6"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2.5 rounded-full bg-blue-100">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">{apt.doctor_name}</h3>
                                                <p className="text-gray-600 text-sm flex items-center gap-2">
                                                    <Stethoscope className="w-4 h-4" />
                                                    Doctor
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-3 mt-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{apt.appointment_date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>{apt.slot.start_time} - {apt.slot.end_time}</span>
                                            </div>
                                        </div>

                                        {apt.tumor_type && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <span className="text-gray-600">Tumor Type:</span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                                    {apt.tumor_type}
                                                </span>
                                            </div>
                                        )}

                                        {apt.reason && (
                                            <div className="mt-3">
                                                <p className="text-gray-500 text-sm">Reason:</p>
                                                <p className="text-gray-700">{apt.reason}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-start md:items-end gap-3">
                                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(apt.status)}`}>
                                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                        </span>
                                        <p className="text-gray-500 text-xs">
                                            Booked: {new Date(apt.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
                        <p className="text-gray-600 mb-6">You haven't booked any appointments</p>
                        <button
                            onClick={() => router.push("/book-appointment")}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Book Your First Appointment
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

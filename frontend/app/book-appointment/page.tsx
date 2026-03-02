"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Calendar, Clock, User, Stethoscope, Award, ChevronLeft } from "lucide-react";

const API_URL = "http://localhost:8000";

export default function BookAppointment() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tumorType = searchParams.get("tumor");

    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [availability, setAvailability] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        const token = localStorage.getItem("token");

        try {
            const url = tumorType
                ? `${API_URL}/doctors?tumor_type=${tumorType}`
                : `${API_URL}/doctors`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setDoctors(res.data);
        } catch (error) {
            console.error("Error fetching doctors:", error);
        }
    };

    const fetchDoctorAvailability = async (doctorId: string) => {
        const token = localStorage.getItem("token");

        try {
            const res = await axios.get(`${API_URL}/doctors/${doctorId}/availability`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAvailability(res.data);
        } catch (error) {
            console.error("Error fetching availability:", error);
        }
    };

    const handleDoctorSelect = (doctor: any) => {
        setSelectedDoctor(doctor);
        setSelectedDate("");
        setSelectedSlot(null);
        fetchDoctorAvailability(doctor.id);
    };

    const handleBookAppointment = async () => {
        if (!selectedDoctor || !selectedDate || !selectedSlot) {
            alert("Please select a doctor, date, and time slot");
            return;
        }

        const token = localStorage.getItem("token");
        setIsLoading(true);

        try {
            await axios.post(
                `${API_URL}/appointments`,
                {
                    doctor_id: selectedDoctor.id,
                    appointment_date: selectedDate,
                    slot: selectedSlot,
                    reason: reason || null,
                    tumor_type: tumorType || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Appointment booked successfully!");
            router.push("/my-appointments");
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to book appointment");
        } finally {
            setIsLoading(false);
        }
    };

    const getAvailableSlotsForDate = (date: string) => {
        const dayOfWeek = new Date(date).getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const dayAvailability: any = availability.find((a: any) => a.day_of_week === adjustedDay);
        return dayAvailability?.slots || [];
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
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
                    Back
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">Book Appointment</h1>
                    {tumorType && (
                        <p className="text-gray-600">
                            Finding specialists for: <span className="font-semibold text-blue-600">{tumorType}</span>
                        </p>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Doctor Selection */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Doctor</h2>

                        {doctors.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {doctors.map((doctor: any) => (
                                    <motion.div
                                        key={doctor.id}
                                        whileHover={{ scale: 1.01 }}
                                        onClick={() => handleDoctorSelect(doctor)}
                                        className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${selectedDoctor?.id === doctor.id
                                            ? "bg-blue-50 border-blue-500"
                                            : "bg-white border-gray-200 hover:border-blue-300"
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-full bg-blue-100">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                                                <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                                                    <Stethoscope className="w-4 h-4" />
                                                    {doctor.speciality}
                                                </p>
                                                <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
                                                    <Award className="w-4 h-4" />
                                                    {doctor.experience} years experience
                                                </p>
                                                {doctor.expert_in.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {doctor.expert_in.map((expertise: string) => (
                                                            <span
                                                                key={expertise}
                                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                                            >
                                                                {expertise}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-600">
                                No doctors found. Please try again later.
                            </div>
                        )}
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-24">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Details</h2>

                        {selectedDoctor ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-600 text-sm mb-1">Selected Doctor</p>
                                    <p className="text-gray-900 font-medium">{selectedDoctor.name}</p>
                                </div>

                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        Select Date
                                    </label>
                                    <input
                                        type="date"
                                        min={getMinDate()}
                                        value={selectedDate}
                                        onChange={(e) => {
                                            setSelectedDate(e.target.value);
                                            setSelectedSlot(null);
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {selectedDate && (
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-2">
                                            <Clock className="w-4 h-4 inline mr-2" />
                                            Select Time Slot
                                        </label>
                                        <div className="space-y-2">
                                            {getAvailableSlotsForDate(selectedDate).length > 0 ? (
                                                getAvailableSlotsForDate(selectedDate).map((slot: any, index: number) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${selectedSlot === slot
                                                            ? "bg-blue-50 border-blue-500 text-blue-700"
                                                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                                                            }`}
                                                    >
                                                        {slot.start_time} - {slot.end_time}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-sm">No available slots for this day</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-2">Reason (Optional)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Brief description of your condition..."
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={3}
                                    />
                                </div>

                                <button
                                    onClick={handleBookAppointment}
                                    disabled={!selectedDate || !selectedSlot || isLoading}
                                    className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {isLoading ? "Booking..." : "Book Appointment"}
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8">
                                Select a doctor to continue
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

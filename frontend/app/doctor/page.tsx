"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const API_URL = "http://localhost:8000";

export default function DoctorDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [activeTab, setActiveTab] = useState("appointments");
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        name: "",
        speciality: "",
        experience: 0,
        expert_in: [],
    });
    const [availabilityForm, setAvailabilityForm] = useState({
        day_of_week: 0,
        slots: [{ start_time: "09:00", end_time: "10:00" }],
    });
    const router = useRouter();

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "doctor") {
            router.push("/login");
            return;
        }

        fetchDoctorData();
    }, [activeTab]);

    const fetchDoctorData = async () => {
        const token = localStorage.getItem("token");
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };

        try {
            if (activeTab === "profile") {
                const res = await axios.get(`${API_URL}/doctor/profile`, config);
                setProfile(res.data);
                setProfileData({
                    name: res.data.name,
                    speciality: res.data.speciality,
                    experience: res.data.experience,
                    expert_in: res.data.expert_in || [],
                });
            } else if (activeTab === "appointments") {
                const res = await axios.get(`${API_URL}/doctor/appointments`, config);
                setAppointments(res.data);
            } else if (activeTab === "patients") {
                const res = await axios.get(`${API_URL}/doctor/patients`, config);
                setPatients(res.data);
            } else if (activeTab === "availability") {
                const res = await axios.get(`${API_URL}/doctor/availability`, config);
                setAvailability(res.data);
            }
        } catch (error: any) {
            console.error("Error:", error);
            if (error.response?.status === 401) {
                router.push("/login");
            }
        }
    };

    const updateProfile = async (e: any) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            await axios.patch(
                `${API_URL}/doctor/profile`,
                profileData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Profile updated successfully");
            setEditMode(false);
            fetchDoctorData();
        } catch (error) {
            alert("Failed to update profile");
        }
    };

    const updateAppointmentStatus = async (appointmentId: string, status: string) => {
        const token = localStorage.getItem("token");

        try {
            await axios.patch(
                `${API_URL}/doctor/appointments/${appointmentId}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchDoctorData();
        } catch (error) {
            alert("Failed to update appointment");
        }
    };

    const addAvailability = async (e: any) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            await axios.post(
                `${API_URL}/doctor/availability`,
                availabilityForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Availability added successfully");
            setAvailabilityForm({
                day_of_week: 0,
                slots: [{ start_time: "09:00", end_time: "10:00" }],
            });
            fetchDoctorData();
        } catch (error) {
            alert("Failed to add availability");
        }
    };

    // handleLogout removed as Navbar handles it

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-200">
                    {["appointments", "patients", "availability", "profile"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Appointments Tab */}
                {activeTab === "appointments" && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tumor Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {appointments.map((apt: any) => (
                                    <tr key={apt.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{apt.patient_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{apt.appointment_date}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{apt.slot.start_time} - {apt.slot.end_time}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{apt.tumor_type || "N/A"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${apt.status === "confirmed" ? "bg-green-100 text-green-800" :
                                                apt.status === "rejected" ? "bg-red-100 text-red-800" :
                                                    apt.status === "completed" ? "bg-blue-100 text-blue-800" :
                                                        "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {apt.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => updateAppointmentStatus(apt.id, "confirmed")}
                                                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => updateAppointmentStatus(apt.id, "rejected")}
                                                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                            {apt.status === "confirmed" && (
                                                <button
                                                    onClick={() => updateAppointmentStatus(apt.id, "completed")}
                                                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Patients Tab */}
                {activeTab === "patients" && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tumor Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Prediction</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Confidence</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {patients.map((patient: any) => (
                                    <tr key={patient.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.patient_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{patient.patient_email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{patient.tumor_type || "N/A"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{patient.prediction?.class || "N/A"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {patient.prediction?.confidence
                                                ? `${(patient.prediction.confidence * 100).toFixed(1)}%`
                                                : "N/A"
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(patient.appointment_date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Availability Tab */}
                {activeTab === "availability" && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Availability</h3>
                            <form onSubmit={addAvailability} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                                    <select
                                        value={availabilityForm.day_of_week}
                                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, day_of_week: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {daysOfWeek.map((day, idx) => (
                                            <option key={idx} value={idx}>{day}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="time"
                                            value={availabilityForm.slots[0].start_time}
                                            onChange={(e) => setAvailabilityForm({
                                                ...availabilityForm,
                                                slots: [{ ...availabilityForm.slots[0], start_time: e.target.value }]
                                            })}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <span className="flex items-center text-gray-500">to</span>
                                        <input
                                            type="time"
                                            value={availabilityForm.slots[0].end_time}
                                            onChange={(e) => setAvailabilityForm({
                                                ...availabilityForm,
                                                slots: [{ ...availabilityForm.slots[0], end_time: e.target.value }]
                                            })}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Availability
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Current Schedule</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {availability.map((avail: any) => (
                                    <div key={avail.id} className="px-6 py-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-900">{daysOfWeek[avail.day_of_week]}</p>
                                                <div className="mt-2 space-y-1">
                                                    {avail.slots.map((slot: any, idx: number) => (
                                                        <p key={idx} className="text-sm text-gray-600">
                                                            {slot.start_time} - {slot.end_time}
                                                            {slot.is_booked && <span className="ml-2 text-red-600">(Booked)</span>}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && profile && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                {editMode ? "Cancel" : "Edit Profile"}
                            </button>
                        </div>

                        {editMode ? (
                            <form onSubmit={updateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Speciality</label>
                                    <input
                                        type="text"
                                        value={profileData.speciality}
                                        onChange={(e) => setProfileData({ ...profileData, speciality: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
                                    <input
                                        type="number"
                                        value={profileData.experience}
                                        onChange={(e) => setProfileData({ ...profileData, experience: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Name</p>
                                    <p className="text-base text-gray-900 mt-1">{profile.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Email</p>
                                    <p className="text-base text-gray-900 mt-1">{profile.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Speciality</p>
                                    <p className="text-base text-gray-900 mt-1">{profile.speciality}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Experience</p>
                                    <p className="text-base text-gray-900 mt-1">{profile.experience} years</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Expert In</p>
                                    <p className="text-base text-gray-900 mt-1">{profile.expert_in?.join(", ") || "Not specified"}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

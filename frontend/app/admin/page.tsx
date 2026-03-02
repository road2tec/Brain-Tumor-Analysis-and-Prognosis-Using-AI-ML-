"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const API_URL = "http://localhost:8000";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [newDoctor, setNewDoctor] = useState<{
        name: string;
        email: string;
        speciality: string;
        experience: number;
        expert_in: string[];
        hospital_id: string;
    }>({
        name: "",
        email: "",
        speciality: "",
        experience: 0,
        expert_in: [],
        hospital_id: "",
    });
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [showAddHospital, setShowAddHospital] = useState(false);
    const [newHospital, setNewHospital] = useState({
        hospital_name: "",
        hospital_type: "Government",
        registration_number: "",
        emergency_available: false,
        is_24x7: false,
        latitude: "",
        longitude: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        total_beds: 0,
        icu_beds: 0,
        ventilators: 0,
        other_info: "",
        hospital_image: null as File | null
    });
    const [hospitalSearchQuery, setHospitalSearchQuery] = useState("");
    const [hospitalSearchResults, setHospitalSearchResults] = useState<any[]>([]);
    const [isSearchingHospital, setIsSearchingHospital] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState<any>(null);
    const [showPasswordModal, setShowPasswordModal] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== "admin") {
            router.push("/login");
            return;
        }

        fetchDashboardData();
    }, [activeTab]);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem("token");
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };

        try {
            if (activeTab === "dashboard") {
                const res = await axios.get(`${API_URL}/admin/dashboard`, config);
                setStats(res.data);
            } else if (activeTab === "doctors") {
                const res = await axios.get(`${API_URL}/admin/doctors`, config);
                setDoctors(res.data);
                // Fetch hospitals for dropdown
                const hospRes = await axios.get(`${API_URL}/hospitals`, config);
                setHospitals(hospRes.data);
            } else if (activeTab === "users") {
                const res = await axios.get(`${API_URL}/admin/users`, config);
                setUsers(res.data);
            } else if (activeTab === "appointments") {
                const res = await axios.get(`${API_URL}/admin/appointments`, config);
                setAppointments(res.data);
            } else if (activeTab === "hospitals") {
                const res = await axios.get(`${API_URL}/hospitals`, config);
                setHospitals(res.data);
            }
        } catch (error: any) {
            console.error("Error fetching data:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                router.push("/login");
            }
        }
    };

    const handleAddDoctor = async (e: any) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            const res = await axios.post(
                `${API_URL}/admin/doctors`,
                newDoctor,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setGeneratedPassword({
                email: res.data.email,
                password: res.data.password,
            });
            setShowPasswordModal(true); // Added this line as per instruction

            setNewDoctor({
                name: "",
                email: "",
                speciality: "",
                experience: 0,
                expert_in: [],
                hospital_id: "",
            });

            fetchDashboardData();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to create doctor");
        }
    };

    const handleAddHospital = async (e: any) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        const formData = new FormData();
        Object.entries(newHospital).forEach(([key, value]) => {
            if (value !== null) {
                formData.append(key, value as any);
            }
        });

        try {
            await axios.post(
                `${API_URL}/admin/hospitals`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setNewHospital({
                hospital_name: "",
                hospital_type: "Government",
                registration_number: "",
                emergency_available: false,
                is_24x7: false,
                latitude: "",
                longitude: "",
                address_line1: "",
                address_line2: "",
                city: "",
                state: "",
                country: "",
                pincode: "",
                total_beds: 0,
                icu_beds: 0,
                ventilators: 0,
                other_info: "",
                hospital_image: null
            });
            setShowAddHospital(false);
            fetchDashboardData();
            alert("Hospital added successfully!");
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to add hospital");
        }
    };

    const handleHospitalSearch = async () => {
        if (!hospitalSearchQuery) return;
        setIsSearchingHospital(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${hospitalSearchQuery}`);
            const data = await response.json();
            setHospitalSearchResults(data);
        } catch (error) {
            console.error("Error searching location:", error);
            alert("Failed to search location");
        }
        setIsSearchingHospital(false);
    };

    const selectHospitalLocation = (result: any) => {
        setNewHospital(prev => ({
            ...prev,
            latitude: result.lat,
            longitude: result.lon,
            address_line1: result.display_name.split(",")[0],
            address_line2: result.display_name.split(",").slice(1, 3).join(",").trim(),
            city: result.address?.city || result.address?.town || result.address?.village || "", // Nominatim often returns address details in 'address' object if requested, but standard search returns display_name. We'll parse what we can or rely on user input. 
            // Note: Standard 'search' endpoint might not return structured address unless '&addressdetails=1' is added.
            // Let's refine the fetch to include address details for better parsing
        }));
        // Re-fetching with address details to be sure
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${result.lat}&lon=${result.lon}`)
            .then(res => res.json())
            .then(data => {
                setNewHospital(prev => ({
                    ...prev,
                    latitude: result.lat,
                    longitude: result.lon,
                    address_line1: data.address?.road || data.address?.building || data.display_name.split(",")[0],
                    address_line2: data.address?.suburb || data.address?.neighbourhood || "",
                    city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || "",
                    state: data.address?.state || "",
                    country: data.address?.country || "",
                    pincode: data.address?.postcode || ""
                }));
            });

        setHospitalSearchResults([]);
        setHospitalSearchQuery("");
    };

    const toggleDoctorStatus = async (doctorId: any, currentStatus: any) => {
        const token = localStorage.getItem("token");

        try {
            await axios.patch(
                `${API_URL}/admin/doctors/${doctorId}/status`,
                { is_active: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDoctors(prevDoctors =>
                prevDoctors.map(d => (d.id === doctorId ? { ...d, is_active: !currentStatus } : d))
            ); // Updated to directly modify state
        } catch (error) {
            alert("Failed to update doctor status");
        }
    };

    const toggleUserStatus = async (userId: any, currentStatus: any) => {
        const token = localStorage.getItem("token");

        try {
            await axios.patch(
                `${API_URL}/admin/users/${userId}/status`,
                { is_active: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers(prevUsers =>
                prevUsers.map(u => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
            ); // Updated to directly modify state
        } catch (error) {
            alert("Failed to update user status");
        }
    };

    const showDoctorPassword = (doctor: any) => {
        if (doctor.temp_password) {
            setShowPasswordModal({
                email: doctor.email,
                password: doctor.temp_password
            });
        } else {
            if (confirm("No password available. Would you like to reset the password to generate a new one?")) {
                resetDoctorPassword(doctor.id);
            }
        }
    };

    const resetDoctorPassword = async (doctorId: any) => {
        const token = localStorage.getItem("token");

        try {
            const res = await axios.patch(
                `${API_URL}/admin/doctors/${doctorId}/reset-password`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDoctors(prevDoctors =>
                prevDoctors.map(d => (d.id === doctorId ? { ...d, temp_password: res.data.password } : d))
            ); // Updated to directly modify state
            alert(`✅ Password Reset Successful!\n\n📧 Email: ${res.data.email}\n🔑 New Password: ${res.data.password}\n\n⚠️ IMPORTANT: Copy this password now!`);
        } catch (error) {
            alert("Failed to reset password");
        }
    };

    const handleExpertiseToggle = (expertise: any) => {
        setNewDoctor(prev => ({
            ...prev,
            expert_in: prev.expert_in.includes(expertise)
                ? prev.expert_in.filter((e: any) => e !== expertise)
                : [...prev.expert_in, expertise]
        }));
    };

    // handleLogout removed as Navbar handles it

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-8 pt-24"> {/* Added pt-24 */}
                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-200">
                    {["dashboard", "doctors", "users", "appointments", "hospitals"].map((tab) => (
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

                {/* Dashboard Stats */}
                {activeTab === "dashboard" && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        <StatsCard title="Total Users" value={stats.total_users} subtitle={`${stats.active_users} active`} />
                        <StatsCard title="Total Doctors" value={stats.total_doctors} subtitle={`${stats.active_doctors} active`} />
                        <StatsCard title="Hospitals" value={stats.total_hospitals} subtitle={`${stats.active_hospitals} active`} />
                        <StatsCard title="Appointments" value={stats.total_appointments} subtitle={`${stats.pending_appointments} pending`} />
                        <StatsCard title="Predictions" value={stats.total_predictions} subtitle="Total scans" />
                    </div>
                )}

                {/* Doctors Tab */}
                {activeTab === "doctors" && (
                    <div>
                        <div className="mb-6">
                            <button
                                onClick={() => setShowAddDoctor(!showAddDoctor)}
                                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {showAddDoctor ? "Cancel" : "+ Add Doctor"}
                            </button>
                        </div>

                        {showAddDoctor && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Doctor</h3>
                                <form onSubmit={handleAddDoctor} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={newDoctor.name}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={newDoctor.email}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Speciality (e.g., Neurosurgeon)"
                                        value={newDoctor.speciality}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, speciality: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Years of Experience"
                                        value={newDoctor.experience}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, experience: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Expert In:</p>
                                        <div className="flex gap-4">
                                            {["Glioma", "Meningioma", "Pituitary"].map((expertise) => (
                                                <label key={expertise} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newDoctor.expert_in.includes(expertise)}
                                                        onChange={() => handleExpertiseToggle(expertise)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{expertise}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <select
                                            value={newDoctor.hospital_id}
                                            onChange={(e) => setNewDoctor({ ...newDoctor, hospital_id: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Select Hospital</option>
                                            {hospitals.map((h: any) => (
                                                <option key={h.id} value={h.id}>
                                                    {h.hospital_name} ({h.location?.city || "Unknown City"})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Create Doctor
                                    </button>
                                </form>

                                {generatedPassword && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-green-800 font-semibold mb-2">Doctor Created Successfully!</p>
                                        <p className="text-gray-700 text-sm">Email: {generatedPassword.email}</p>
                                        <p className="text-gray-700 text-sm">Password: <span className="font-mono bg-white px-2 py-1 rounded border border-green-200">{generatedPassword.password}</span></p>
                                        <p className="text-gray-600 text-xs mt-2">⚠️ Save these credentials securely!</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Speciality</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Experience</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expert In</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hospital</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {doctors.map((doctor: any) => (
                                        <tr key={doctor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{doctor.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{doctor.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{doctor.speciality}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{doctor.experience} years</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{doctor.expert_in.join(", ")}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{doctor.hospital_name || "N/A"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${doctor.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {doctor.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleDoctorStatus(doctor.id, doctor.is_active)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${doctor.is_active
                                                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                                                            : "bg-green-50 text-green-700 hover:bg-green-100"
                                                            }`}
                                                    >
                                                        {doctor.is_active ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <button
                                                        onClick={() => showDoctorPassword(doctor)}
                                                        className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        Show Password
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                }`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${user.is_active
                                                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                                                    : "bg-green-50 text-green-700 hover:bg-green-100"
                                                    }`}
                                            >
                                                {user.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Appointments Tab */}
                {activeTab === "appointments" && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Doctor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tumor Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {appointments.map((apt: any) => (
                                    <tr key={apt.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{apt.patient_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{apt.doctor_name}</td>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Hospitals Tab */}
                {activeTab === "hospitals" && (
                    <div>
                        <div className="mb-6">
                            <button
                                onClick={() => setShowAddHospital(!showAddHospital)}
                                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {showAddHospital ? "Cancel" : "+ Add Hospital"}
                            </button>
                        </div>

                        {showAddHospital && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Hospital</h3>
                                <form onSubmit={handleAddHospital} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Hospital Name"
                                            value={newHospital.hospital_name}
                                            onChange={(e) => setNewHospital({ ...newHospital, hospital_name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            required
                                        />
                                        <select
                                            value={newHospital.hospital_type}
                                            onChange={(e) => setNewHospital({ ...newHospital, hospital_type: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                        >
                                            <option value="Government">Government</option>
                                            <option value="Private">Private</option>
                                            <option value="Trust">Trust</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Registration Number"
                                            value={newHospital.registration_number}
                                            onChange={(e) => setNewHospital({ ...newHospital, registration_number: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={newHospital.emergency_available}
                                                onChange={(e) => setNewHospital({ ...newHospital, emergency_available: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-gray-700">Emergency Available</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={newHospital.is_24x7}
                                                onChange={(e) => setNewHospital({ ...newHospital, is_24x7: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-gray-700">24x7 Open</span>
                                        </label>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-semibold text-gray-700 mb-3">📍 Location Details</h4>

                                        {/* Search Box */}
                                        <div className="mb-4 relative">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Search Location (e.g. Nagpur)"
                                                    value={hospitalSearchQuery}
                                                    onChange={(e) => setHospitalSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleHospitalSearch())}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleHospitalSearch}
                                                    disabled={isSearchingHospital}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {isSearchingHospital ? "Searching..." : "Search"}
                                                </button>
                                            </div>
                                            {hospitalSearchResults.length > 0 && (
                                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                                    {hospitalSearchResults.map((result: any, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => selectHospitalLocation(result)}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                                                        >
                                                            {result.display_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input
                                                type="text"
                                                placeholder="Latitude"
                                                value={newHospital.latitude}
                                                onChange={(e) => setNewHospital({ ...newHospital, latitude: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Longitude"
                                                value={newHospital.longitude}
                                                onChange={(e) => setNewHospital({ ...newHospital, longitude: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input
                                                type="text"
                                                placeholder="Address Line 1"
                                                value={newHospital.address_line1}
                                                onChange={(e) => setNewHospital({ ...newHospital, address_line1: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Address Line 2"
                                                value={newHospital.address_line2}
                                                onChange={(e) => setNewHospital({ ...newHospital, address_line2: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={newHospital.city}
                                                onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={newHospital.state}
                                                onChange={(e) => setNewHospital({ ...newHospital, state: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Country"
                                                value={newHospital.country}
                                                onChange={(e) => setNewHospital({ ...newHospital, country: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Pincode"
                                                value={newHospital.pincode}
                                                onChange={(e) => setNewHospital({ ...newHospital, pincode: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-semibold text-gray-700 mb-3">🏥 Infrastructure</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <input
                                                type="number"
                                                placeholder="Total Beds"
                                                value={newHospital.total_beds}
                                                onChange={(e) => setNewHospital({ ...newHospital, total_beds: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                placeholder="ICU Beds"
                                                value={newHospital.icu_beds}
                                                onChange={(e) => setNewHospital({ ...newHospital, icu_beds: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Ventilators"
                                                value={newHospital.ventilators}
                                                onChange={(e) => setNewHospital({ ...newHospital, ventilators: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setNewHospital({ ...newHospital, hospital_image: e.target.files[0] });
                                                }
                                            }}
                                            className="w-full"
                                        />
                                    </div>

                                    <textarea
                                        placeholder="Other Information"
                                        value={newHospital.other_info}
                                        onChange={(e) => setNewHospital({ ...newHospital, other_info: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                        rows={3}
                                    />

                                    <button
                                        type="submit"
                                        className="w-full px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Add Hospital
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hospital Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact/Info</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {hospitals.map((hospital: any) => (
                                        <tr key={hospital.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {hospital.hospital_image && (
                                                        <img
                                                            src={`${API_URL}/${hospital.hospital_image}`}
                                                            alt={hospital.hospital_name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{hospital.hospital_name}</div>
                                                        <div className="text-xs text-gray-500">{hospital.registration_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{hospital.hospital_type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {hospital.location ? (
                                                    <div>
                                                        <p className="font-medium">{hospital.location.city}, {hospital.location.state}</p>
                                                        <p className="text-xs text-gray-500">{hospital.location.address_line1}</p>
                                                        <p className="text-xs text-gray-500">{hospital.location.country}</p>
                                                    </div>
                                                ) : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div>
                                                    <p className="text-xs">Beds: {hospital.infrastructure?.total_beds}</p>
                                                    <p className="text-xs">ICU: {hospital.infrastructure?.icu_beds}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Delete hospital?')) {
                                                            const token = localStorage.getItem("token");
                                                            await axios.delete(`${API_URL}/admin/hospitals/${hospital.id}`, {
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            fetchDashboardData();
                                                        }
                                                    }}
                                                    className="text-red-600 hover:text-red-900 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Doctor Credentials
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Email:</label>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-900 font-mono select-all">{showPasswordModal.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Password:</label>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 relative">
                                    <p className="text-sm text-gray-900 font-mono select-all pr-16">{showPasswordModal.password}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(showPasswordModal.password);
                                            alert("Password copied to clipboard!");
                                        }}
                                        className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-xs">
                                ⚠️ Share these credentials securely with the doctor.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPasswordModal(null)}
                            className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function StatsCard({ title, value, subtitle }: any) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
            <p className="text-3xl font-semibold text-gray-900 mb-1">{value}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
    );
}

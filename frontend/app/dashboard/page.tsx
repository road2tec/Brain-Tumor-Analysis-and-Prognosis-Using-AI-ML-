"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Upload, X, FileImage, Activity, History, Clock, Sparkles, MapPin, User, Phone, Calendar, Users } from 'lucide-react';
import clsx from 'clsx';

interface Prediction {
    id: string;
    filename: string;
    prediction: string;
    confidence: number;
    timestamp: string;
    suggested_doctors?: Array<{
        id: string;
        name: string;
        speciality: string;
        experience: number;
    }>;
}

interface DiseaseInfo {
    disease: string;
    treatment_plan: string[];
    symptoms?: string[];
    prevention?: string[];
    guidelines?: string[];
}

interface DoctorWithDistance {
    id: string;
    name: string;
    email: string;
    speciality: string;
    experience: number;
    expert_in: string[];
    hospital_id?: string;
    hospital_name?: string;
    hospital_address?: string;
    hospital_city?: string;
    hospital_location?: {
        latitude: number;
        longitude: number;
        address_line1?: string;
        city?: string;
        state?: string;
    };
    distance_km?: number;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    age?: number;
    gender?: string;
    location?: {
        latitude: number;
        longitude: number;
        city?: string;
        state?: string;
        country?: string;
    };
}

export default function Dashboard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<Prediction | null>(null);
    const [diseaseInfo, setDiseaseInfo] = useState<DiseaseInfo | null>(null);
    const [history, setHistory] = useState<Prediction[]>([]);
    const [view, setView] = useState<'analyze' | 'history' | 'profile'>('analyze');
    const [isFetchingInsights, setIsFetchingInsights] = useState(false);
    const [nearbyDoctors, setNearbyDoctors] = useState<DoctorWithDistance[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithDistance | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Location search state
    const [locationSearch, setLocationSearch] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

    // Profile state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        age: '',
        gender: ''
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchProfile();
        }
    }, [isLoading, user, router]);

    useEffect(() => {
        if (user && view === 'history') {
            fetchHistory();
        }
    }, [user, view]);

    // Location search with debounce
    useEffect(() => {
        if (locationSearch.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            await searchLocation(locationSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [locationSearch]);

    const searchLocation = async (query: string) => {
        if (query.length < 3) return;

        setIsSearchingLocation(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                {
                    headers: {
                        'User-Agent': 'BrainTumorAnalysis/1.0'
                    }
                }
            );
            const data = await response.json();
            setLocationSuggestions(data);
            setShowLocationSuggestions(true);
        } catch (error) {
            console.error('Location search failed:', error);
        } finally {
            setIsSearchingLocation(false);
        }
    };

    const selectLocation = async (location: any) => {
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);

        console.log('Selected location from search:', location);

        try {
            // Always do reverse geocoding to get complete address info
            const addressInfo = await reverseGeocode(lat, lon);

            const locationData = {
                latitude: lat,
                longitude: lon,
                city: addressInfo.city || location.address?.city || location.address?.town || location.address?.village || '',
                state: addressInfo.state || location.address?.state || '',
                country: addressInfo.country || location.address?.country || ''
            };

            console.log('Final location data to save:', locationData);

            const response = await api.patch('/users/me', {
                location: locationData
            });

            console.log('Location update response:', response.data);

            // Refresh profile to get updated data
            await fetchProfile();

            console.log('Profile refreshed, new profile:', profile);

            setLocationSearch('');
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
            alert('Location updated successfully!');

            // Fetch nearby doctors if we have a tumor type
            if (result && result.prediction !== "No Tumor") {
                fetchNearbyDoctors(result.prediction, lat, lon);
            }
        } catch (error) {
            console.error("Failed to update location", error);
            alert('Failed to update location');
        }
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
                {
                    headers: {
                        'User-Agent': 'BrainTumorAnalysis/1.0'
                    }
                }
            );
            const data = await response.json();
            return {
                city: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '',
                state: data.address?.state || '',
                country: data.address?.country || ''
            };
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return { city: '', state: '', country: '' };
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/me');
            console.log('Fetched profile data:', res.data);
            console.log('Location in profile:', res.data.location);
            setProfile(res.data);
            setProfileForm({
                name: res.data.name || '',
                phone: res.data.phone || '',
                age: res.data.age?.toString() || '',
                gender: res.data.gender || ''
            });
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/history');
            setHistory(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handleGetLocation = async () => {
        setIsLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    try {
                        // Get location details via reverse geocoding
                        const locationDetails = await reverseGeocode(latitude, longitude);

                        // Update user location with full details
                        await api.patch('/users/me', {
                            location: {
                                latitude,
                                longitude,
                                city: locationDetails.city,
                                state: locationDetails.state,
                                country: locationDetails.country
                            }
                        });

                        // Refresh profile
                        await fetchProfile();
                        alert('Location updated successfully!');

                        // Fetch nearby doctors if we have a tumor type
                        if (result && result.prediction !== "No Tumor") {
                            fetchNearbyDoctors(result.prediction, latitude, longitude);
                        }
                    } catch (error) {
                        console.error("Failed to update location", error);
                        alert('Failed to update location');
                    } finally {
                        setIsLoadingLocation(false);
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert('Failed to get location. Please enable location access.');
                    setIsLoadingLocation(false);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
            setIsLoadingLocation(false);
        }
    };

    const fetchNearbyDoctors = async (tumorType?: string, lat?: number, lon?: number) => {
        try {
            const params: any = {};
            if (tumorType) params.tumor_type = tumorType;
            if (lat !== undefined) params.latitude = lat;
            if (lon !== undefined) params.longitude = lon;

            const res = await api.get('/doctors/nearby', { params });
            setNearbyDoctors(res.data);
        } catch (error) {
            console.error("Failed to fetch nearby doctors", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setDiseaseInfo(null);
            setNearbyDoctors([]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selected = e.dataTransfer.files[0];
            if (selected.type.startsWith('image/')) {
                setFile(selected);
                setPreview(URL.createObjectURL(selected));
                setResult(null);
                setDiseaseInfo(null);
                setNearbyDoctors([]);
            }
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/predict', formData);
            setResult(res.data);

            if (res.data.prediction !== "No Tumor") {
                fetchDiseaseInfo(res.data.prediction);
                // Fetch nearby doctors if location is available
                if (profile?.location) {
                    fetchNearbyDoctors(
                        res.data.prediction,
                        profile.location.latitude,
                        profile.location.longitude
                    );
                }
            }
        } catch (error) {
            console.error("Prediction failed", error);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const fetchDiseaseInfo = async (diseaseName: string) => {
        setIsFetchingInsights(true);
        try {
            const res = await api.post('/treatment', { disease: diseaseName });
            setDiseaseInfo(res.data);
        } catch (error) {
            console.error("Failed to fetch insights", error);
        } finally {
            setIsFetchingInsights(false);
        }
    };

    const ensureArray = (data: string | string[] | undefined): string[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        return data.split('\n').filter(line => line.trim() !== '');
    };

    const clearSelection = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setDiseaseInfo(null);
        setNearbyDoctors([]);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updateData: any = {
                name: profileForm.name,
                phone: profileForm.phone || undefined,
                age: profileForm.age ? parseInt(profileForm.age) : undefined,
                gender: profileForm.gender || undefined
            };

            await api.patch('/users/me', updateData);
            await fetchProfile();
            setEditingProfile(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error("Failed to update profile", error);
            alert('Failed to update profile');
        }
    };

    if (isLoading || !user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Diagnostic Dashboard
                        </h1>
                        <p className="text-gray-600">Manage MRI scans, view analysis history, and update your profile.</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('analyze')}
                            className={clsx(
                                "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md",
                                view === 'analyze'
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                            )}
                        >
                            <Activity className="w-4 h-4" />
                            New Analysis
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={clsx(
                                "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md",
                                view === 'history'
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                            )}
                        >
                            <History className="w-4 h-4" />
                            History
                        </button>
                        <button
                            onClick={() => setView('profile')}
                            className={clsx(
                                "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md",
                                view === 'profile'
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                            )}
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </button>
                    </div>
                </div>

                {view === 'profile' && profile && (
                    <div className="bg-white rounded-2xl border-2 border-transparent bg-gradient-to-br from-blue-100 via-white to-purple-100 p-[2px] shadow-xl">
                        <div className="bg-white rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    My Profile
                                </h2>
                                {!editingProfile && (
                                    <button
                                        onClick={() => setEditingProfile(true)}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {editingProfile ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={profileForm.phone}
                                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                                            <input
                                                type="number"
                                                value={profileForm.age}
                                                onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                            <select
                                                value={profileForm.gender}
                                                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingProfile(false)}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                            <User className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <p className="text-sm text-gray-600">Name</p>
                                                <p className="font-bold text-gray-900">{profile.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                            <Phone className="w-8 h-8 text-purple-600" />
                                            <div>
                                                <p className="text-sm text-gray-600">Phone</p>
                                                <p className="font-bold text-gray-900">{profile.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                            <Calendar className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <p className="text-sm text-gray-600">Age</p>
                                                <p className="font-bold text-gray-900">{profile.age || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                                            <Users className="w-8 h-8 text-purple-600" />
                                            <div>
                                                <p className="text-sm text-gray-600">Gender</p>
                                                <p className="font-bold text-gray-900">{profile.gender || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-8 h-8 text-green-600" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Location</p>
                                                    <p className="font-bold text-gray-900">
                                                        {profile.location
                                                            ? [profile.location.city, profile.location.state, profile.location.country]
                                                                .filter(part => part && part.trim())
                                                                .join(', ') || 'Location coordinates set'
                                                            : 'Not set'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleGetLocation}
                                                disabled={isLoadingLocation}
                                                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50"
                                            >
                                                {isLoadingLocation ? 'Getting Location...' : '📍 Get Live Location'}
                                            </button>
                                        </div>

                                        {/* Manual Location Search */}
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                            <p className="text-sm text-gray-700 font-semibold mb-2">Or search for a location:</p>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={locationSearch}
                                                    onChange={(e) => setLocationSearch(e.target.value)}
                                                    placeholder="Type city name (e.g., Nagpur)..."
                                                    className="w-full px-4 py-2.5 border-2 border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                />
                                                {isSearchingLocation && (
                                                    <div className="absolute right-3 top-3">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                                                    </div>
                                                )}

                                                {/* Location Suggestions Dropdown */}
                                                {showLocationSuggestions && locationSuggestions.length > 0 && (
                                                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-green-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                                                        {locationSuggestions.map((location, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => selectLocation(location)}
                                                                className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border-b border-gray-100 last:border-b-0 transition-all"
                                                            >
                                                                <p className="font-semibold text-gray-900">{location.display_name}</p>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {location.address?.city || location.address?.town || location.address?.village || ''}, {location.address?.state || ''}, {location.address?.country || ''}
                                                                </p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">💡 Type at least 3 characters to search</p>
                                        </div>

                                        {profile.location && (
                                            <p className="text-xs text-gray-600 mt-4">
                                                Coordinates: {profile.location.latitude.toFixed(4)}, {profile.location.longitude.toFixed(4)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === 'analyze' ? (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Upload Section */}
                        <div className="bg-white rounded-2xl border-2 border-transparent bg-gradient-to-br from-blue-100 via-white to-purple-100 p-[2px] shadow-xl">
                            <div className="bg-white rounded-2xl p-6 h-full">
                                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                                    Upload MRI Scan
                                </h2>

                                {!preview ? (
                                    <div
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop}
                                        className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-purple-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all cursor-pointer relative"
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 w-fit mx-auto mb-4">
                                            <Upload className="w-12 h-12 text-blue-600" />
                                        </div>
                                        <p className="text-gray-700 font-semibold mb-2">Drop MRI image here, or click to browse</p>
                                        <p className="text-sm text-gray-500">Supports JPG, PNG formats</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="relative rounded-xl overflow-hidden border-2 border-blue-200 bg-gray-100 aspect-square flex items-center justify-center">
                                            <img src={preview} alt="Upload preview" className="max-h-full max-w-full object-contain" />
                                            <button
                                                onClick={clearSelection}
                                                className="absolute top-4 right-4 p-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors shadow-md"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                                                    <FileImage className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="text-gray-900 font-semibold truncate max-w-[200px]">{file?.name}</p>
                                                    <p className="text-gray-600">{(file?.size! / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            {isAnalyzing ? "Analyzing Scan..." : "🚀 Run AI Analysis"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result Section */}
                        <div className="space-y-6">
                            {result ? (
                                <div className="bg-white rounded-2xl border-2 border-transparent bg-gradient-to-br from-blue-100 via-white to-purple-100 p-[2px] shadow-xl">
                                    <div className="bg-white rounded-2xl p-6">
                                        <div className="mb-6 pb-6 border-b border-gray-200 flex justify-between items-center">
                                            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                Analysis Result
                                            </h3>
                                            <span className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleString()}</span>
                                        </div>

                                        <div className="text-center mb-8">
                                            <div className="mb-4">
                                                <span className={clsx(
                                                    "text-4xl font-bold",
                                                    result.prediction === "No Tumor" ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {result.prediction}
                                                </span>
                                            </div>
                                            <p className="text-base text-gray-600">detected with</p>
                                            <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                {(result.confidence * 100).toFixed(2)}%
                                                <span className="text-base font-normal text-gray-500 ml-2">confidence</span>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 shadow-inner">
                                            <div className="flex justify-between text-sm mb-3">
                                                <span className="text-gray-700 font-semibold">Confidence Score</span>
                                                <span className="text-gray-900 font-mono font-bold">{(result.confidence * 100).toFixed(2)}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-white rounded-full overflow-hidden shadow-md">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000 ease-out shadow-lg"
                                                    style={{ width: `${result.confidence * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 border-l-4 border-yellow-500 pl-4 py-3 bg-yellow-50 rounded-r-xl">
                                            <p className="text-yellow-800 text-sm">
                                                <strong>Disclaimer:</strong> ML-based results are for assistance only and must be verified by a medical professional.
                                            </p>
                                        </div>

                                        {/* AI Insights Section */}
                                        {isFetchingInsights && (
                                            <div className="mt-6 p-12 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-blue-200">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                                <p className="text-blue-600 font-semibold italic">Analyzing Disease Information...</p>
                                            </div>
                                        )}

                                        {diseaseInfo && (
                                            <div className="mt-8 space-y-6">
                                                <div className="p-1 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-xl">
                                                    <div className="bg-white rounded-[14px] p-6">
                                                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                                                            <Sparkles className="w-6 h-6 text-purple-600" />
                                                            AI Disease Insights: {diseaseInfo.disease}
                                                        </h3>

                                                        <div className="grid gap-6">
                                                            {/* Symptoms */}
                                                            <div className="bg-blue-50 p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
                                                                <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                                                                    🚩 Symptoms
                                                                </h4>
                                                                <div className="text-gray-700 text-sm leading-relaxed">
                                                                    <ul className="list-disc pl-5 space-y-1">
                                                                        {ensureArray(diseaseInfo.symptoms).map((item, i) => (
                                                                            <li key={i}>{item}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>

                                                            {/* Treatment */}
                                                            <div className="bg-purple-50 p-5 rounded-xl border-l-4 border-purple-500 shadow-sm">
                                                                <h4 className="text-purple-800 font-bold mb-2 flex items-center gap-2">
                                                                    💊 Treatment Plan
                                                                </h4>
                                                                <div className="text-gray-700 text-sm leading-relaxed">
                                                                    <ul className="list-disc pl-5 space-y-1">
                                                                        {ensureArray(diseaseInfo.treatment_plan).map((item, i) => (
                                                                            <li key={i}>{item}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>

                                                            {/* Prevention */}
                                                            <div className="bg-green-50 p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
                                                                <h4 className="text-green-800 font-bold mb-2 flex items-center gap-2">
                                                                    🛡️ Prevention & Management
                                                                </h4>
                                                                <div className="text-gray-700 text-sm leading-relaxed">
                                                                    <ul className="list-disc pl-5 space-y-1">
                                                                        {ensureArray(diseaseInfo.prevention).map((item, i) => (
                                                                            <li key={i}>{item}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>

                                                            {/* Guidelines */}
                                                            <div className="bg-pink-50 p-5 rounded-xl border-l-4 border-pink-500 shadow-sm">
                                                                <h4 className="text-pink-800 font-bold mb-2 flex items-center gap-2">
                                                                    📋 Guidelines
                                                                </h4>
                                                                <div className="text-gray-700 text-sm leading-relaxed">
                                                                    <ul className="list-disc pl-5 space-y-1">
                                                                        {ensureArray(diseaseInfo.guidelines).map((item, i) => (
                                                                            <li key={i}>{item}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Nearby Doctors Section */}
                                        {nearbyDoctors.length > 0 && (
                                            <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md">
                                                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-2">
                                                    <MapPin className="w-5 h-5 text-purple-600" />
                                                    Recommended Specialists Near You
                                                </h3>
                                                <p className="text-gray-600 text-sm mb-4">
                                                    Based on your location and diagnosis, here are nearby specialists:
                                                </p>
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                    {nearbyDoctors.map((doctor, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => setSelectedDoctor(doctor)}
                                                            className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:border-purple-400"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <p className="text-gray-900 font-bold text-lg">{doctor.name}</p>
                                                                    <p className="text-gray-600 text-sm">{doctor.speciality}</p>
                                                                    <p className="text-gray-500 text-xs mt-1">{doctor.experience} years experience</p>
                                                                    {doctor.hospital_name && (
                                                                        <div className="mt-2 text-sm">
                                                                            <p className="text-purple-700 font-semibold">🏥 {doctor.hospital_name}</p>
                                                                            {doctor.hospital_city && (
                                                                                <p className="text-gray-600 text-xs">📍 {doctor.hospital_city}</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {doctor.distance_km !== null && doctor.distance_km !== undefined && (
                                                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                                        {doctor.distance_km} km
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl bg-white border-2 border-dashed border-blue-300 text-gray-500">
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                                        <Activity className="w-16 h-16 text-blue-600" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-700">No analysis performed yet</p>
                                    <p className="text-sm text-gray-500">Upload an MRI scan to see results here</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : view === 'history' ? (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
                            <div className="grid grid-cols-4 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 text-sm font-semibold text-gray-700">
                                <div>Date</div>
                                <div>Image</div>
                                <div>Result</div>
                                <div>Confidence</div>
                            </div>

                            {history.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {history.map((item) => (
                                        <div key={item.id} className="grid grid-cols-4 p-4 items-center hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors text-sm">
                                            <div className="text-gray-600 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-600" />
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-gray-900 font-semibold truncate pr-4">{item.filename}</div>
                                            <div>
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-semibold",
                                                    item.prediction === "No Tumor"
                                                        ? "bg-green-100 text-green-700 border border-green-300"
                                                        : "bg-red-100 text-red-700 border border-red-300"
                                                )}>
                                                    {item.prediction}
                                                </span>
                                            </div>
                                            <div className="text-gray-700 font-mono font-semibold">
                                                {(item.confidence * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-gray-500">
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 w-fit mx-auto mb-4">
                                        <History className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <p className="font-semibold text-gray-700">No history found</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Doctor Details Modal */}
                {selectedDoctor && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoctor(null)}>
                        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Doctor Information
                                </h2>
                                <button onClick={() => setSelectedDoctor(null)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedDoctor.name}</h3>
                                    <p className="text-gray-700 font-semibold">{selectedDoctor.speciality}</p>
                                    <p className="text-gray-600 text-sm mt-1">{selectedDoctor.experience} years of experience</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedDoctor.expert_in.map((expertise, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                                {expertise}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {selectedDoctor.hospital_name && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <span className="text-2xl">🏥</span>
                                            Hospital Information
                                        </h4>
                                        <p className="text-gray-900 font-semibold text-lg">{selectedDoctor.hospital_name}</p>
                                        {selectedDoctor.hospital_address && (
                                            <p className="text-gray-600 text-sm mt-2">📍 {selectedDoctor.hospital_address}</p>
                                        )}
                                        {selectedDoctor.hospital_city && (
                                            <p className="text-gray-600 text-sm">{selectedDoctor.hospital_city}</p>
                                        )}
                                        {selectedDoctor.distance_km !== null && selectedDoctor.distance_km !== undefined && (
                                            <div className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
                                                {selectedDoctor.distance_km} km away
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => window.location.href = `/book-appointment?doctor=${selectedDoctor.id}`}
                                    className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-bold shadow-lg hover:shadow-xl"
                                >
                                    📅 Book Appointment with {selectedDoctor.name}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

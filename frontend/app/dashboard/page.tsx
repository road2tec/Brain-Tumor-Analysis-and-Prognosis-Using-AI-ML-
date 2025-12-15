"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Upload, X, FileImage, Activity, History, Clock, Sparkles, Bot, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

interface Prediction {
    id: string;
    filename: string;
    prediction: string;
    confidence: number;
    timestamp: string;
}

export default function Dashboard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<Prediction | null>(null);
    const [history, setHistory] = useState<Prediction[]>([]);
    const [view, setView] = useState<'analyze' | 'history'>('analyze');
    const [treatmentPlan, setTreatmentPlan] = useState<string | null>(null);
    const [isGettingTreatment, setIsGettingTreatment] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const copyToClipboard = () => {
        if (treatmentPlan) {
            navigator.clipboard.writeText(treatmentPlan);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [isLoading, user, router]);

    useEffect(() => {
        if (user && view === 'history') {
            fetchHistory();
        }
    }, [user, view]);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/history');
            setHistory(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
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
            }
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setTreatmentPlan(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/predict', formData);
            setResult(res.data);

            if (res.data.prediction !== "No Tumor") {
                setIsGettingTreatment(true);
                try {
                    const treatmentRes = await api.post('/treatment', { disease: res.data.prediction });
                    setTreatmentPlan(treatmentRes.data.treatment_plan);
                } catch (err) {
                    console.error("Failed to get treatment plan", err);
                } finally {
                    setIsGettingTreatment(false);
                }
            }
        } catch (error) {
            console.error("Prediction failed", error);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearSelection = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setTreatmentPlan(null);
    };

    if (isLoading || !user) return null; // Or loading spinner

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 py-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Diagnostic Dashboard</h1>
                        <p className="text-gray-400">Manage MRI scans and view analysis history.</p>
                    </div>

                    <div className="flex space-x-1 bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setView('analyze')}
                            className={clsx(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                view === 'analyze' ? "bg-primary text-primary-foreground shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Activity className="w-4 h-4" />
                            New Analysis
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={clsx(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                view === 'history' ? "bg-primary text-primary-foreground shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <History className="w-4 h-4" />
                            History
                        </button>
                    </div>
                </div>

                {view === 'analyze' ? (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Upload Section */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 h-fit">
                            <h2 className="text-xl font-semibold text-white mb-6">Upload MRI Scan</h2>

                            {!preview ? (
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer relative"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-300 font-medium mb-2">Drop MRI image here, or click to browse</p>
                                    <p className="text-sm text-gray-500">Supports JPG, PNG, DICOM (converted)</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50 aspect-square md:aspect-video flex items-center justify-center group">
                                        <img src={preview} alt="Upload preview" className="max-h-full max-w-full object-contain" />
                                        <button
                                            onClick={clearSelection}
                                            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-primary/20 text-primary">
                                                <FileImage className="w-5 h-5" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="text-white font-medium truncate max-w-[200px]">{file?.name}</p>
                                                <p className="text-gray-500">{(file?.size! / 1024).toFixed(2)} KB</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isAnalyzing ? "Analyzing Scan..." : "Run Analysis"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Result Section */}
                        <div className="space-y-6">
                            {result ? (
                                <div className="p-8 rounded-2xl bg-white/5 border border-primary/30 shadow-[0_0_30px_rgba(45,212,191,0.1)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[100px] -z-10" />

                                    <div className="mb-6 pb-6 border-b border-white/10 flex justify-between items-center">
                                        <h3 className="text-lg font-medium text-gray-300">Analysis Result</h3>
                                        <span className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleString()}</span>
                                    </div>

                                    <div className="text-center mb-8">
                                        <div className="inline-block mb-4">
                                            <span className={clsx(
                                                "text-5xl font-bold tracking-tight",
                                                result.prediction === "No Tumor" ? "text-green-400" : "text-red-400"
                                            )}>
                                                {result.prediction}
                                            </span>
                                        </div>
                                        <p className="text-lg text-gray-400">detected with</p>
                                        <div className="mt-2 text-3xl font-bold text-primary">
                                            {(result.confidence * 100).toFixed(2)}%
                                            <span className="text-base font-normal text-gray-500 ml-2">confidence</span>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Confidence Score</span>
                                            <span className="text-white font-mono">{(result.confidence * 100).toFixed(2)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000 ease-out"
                                                style={{ width: `${result.confidence * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 border-l-2 border-yellow-500/50 pl-4 py-2 bg-yellow-500/5 rounded-r-lg">
                                        <p className="text-yellow-200/80 text-sm">
                                            <strong>Disclaimer:</strong> AI-based results are for assistance only and must be verified by a medical professional.
                                        </p>
                                    </div>

                                    {isGettingTreatment && (
                                        <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" style={{ transform: 'skewX(-20deg) translateX(-150%)' }} />
                                            <div className="flex items-center gap-3 mb-4">
                                                <Bot className="w-6 h-6 text-primary animate-pulse" />
                                                <h3 className="text-lg font-semibold text-white">Generating Treatment Plan...</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
                                                <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                                                <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
                                            </div>
                                        </div>
                                    )}

                                    {treatmentPlan && (
                                        <div className="mt-6 rounded-xl overflow-hidden border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent transition-all duration-500 ease-in-out">
                                            <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-5 h-5 text-primary" />
                                                    <h3 className="font-semibold text-white">AI Treatment Recommendations</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyToClipboard();
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                        title="Copy to clipboard"
                                                    >
                                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-6 text-gray-300">
                                                    <ReactMarkdown
                                                        components={{
                                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-4 mt-2" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-primary mb-3 mt-6 first:mt-0" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-white mb-2 mt-4" {...props} />,
                                                            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-300 last:mb-0" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2 marker:text-primary" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2 marker:text-primary" {...props} />,
                                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-4 bg-primary/5 rounded-r italic" {...props} />,
                                                        }}
                                                    >
                                                        {treatmentPlan}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-gray-500">
                                    <Activity className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-lg font-medium">No analysis performed yet</p>
                                    <p className="text-sm">Upload an MRI scan to see results here</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                            <div className="grid grid-cols-4 p-4 border-b border-white/10 bg-black/20 text-sm font-medium text-gray-400">
                                <div>Date</div>
                                <div>Image</div>
                                <div>Result</div>
                                <div>Confidence</div>
                            </div>

                            {history.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {history.map((item) => (
                                        <div key={item.id} className="grid grid-cols-4 p-4 items-center hover:bg-white/5 transition-colors text-sm">
                                            <div className="text-gray-300 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-white font-medium truncate pr-4">{item.filename}</div>
                                            <div>
                                                <span className={clsx(
                                                    "px-2 py-1 rounded-full text-xs font-medium border",
                                                    item.prediction === "No Tumor"
                                                        ? "bg-green-400/10 text-green-400 border-green-400/20"
                                                        : "bg-red-400/10 text-red-400 border-red-400/20"
                                                )}>
                                                    {item.prediction}
                                                </span>
                                            </div>
                                            <div className="text-gray-400 font-mono">
                                                {(item.confidence * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-gray-500">
                                    No history found.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

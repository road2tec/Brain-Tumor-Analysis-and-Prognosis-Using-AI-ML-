"use client";

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Brain, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-[100%] blur-[120px] -z-10 pointer-events-none" />

        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-medium text-gray-300">AI-Powered Diagnostics</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.1]">
            Advanced Brain Tumor <br /> Detection System
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Leveraging state-of-the-art Deep Learning to analyze MRI scans with precision.
            Early detection saves lives—experience the power of AI in medical imaging.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group relative px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_40px_rgba(45,212,191,0.3)] hover:shadow-[0_0_60px_rgba(45,212,191,0.5)]"
            >
              Analyze MRI
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-primary" />}
              title="Deep Learning Core"
              description="Powered by ResNet architecture trained on thousands of MRI scans for high-accuracy classification."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Instant Analysis"
              description="Get results in seconds. Our optimized inference engine processes images in real-time."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-primary" />}
              title="Secure & Private"
              description="Your medical data is encrypted and protected. We prioritize patient privacy and data security."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
      <div className="mb-6 p-4 rounded-xl bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

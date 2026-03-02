"use client";

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, Brain, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Medical Diagnostics
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-300%">
                Advanced Brain Tumor
              </span>
              <br />
              <span className="text-gray-900">Detection System</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Leveraging state-of-the-art Deep Learning to analyze MRI scans with precision.
              Early detection saves lives—experience the power of AI in medical imaging.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Analyze MRI Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:border-blue-300 hover:bg-blue-50 transition-all shadow-md"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NeuroScout</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Cutting-edge AI technology meets medical expertise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              gradient="from-blue-500 to-cyan-500"
              title="Deep Learning Core"
              description="Powered by ResNet architecture trained on thousands of MRI scans for high-accuracy classification."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              gradient="from-purple-500 to-pink-500"
              title="Instant Analysis"
              description="Get results in seconds. Our optimized inference engine processes images in real-time."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8" />}
              gradient="from-emerald-500 to-teal-500"
              title="Secure & Private"
              description="Your medical data is encrypted and protected. We prioritize patient privacy and data security."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered system makes brain tumor detection simple and accurate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number="1"
              gradient="from-blue-500 to-cyan-500"
              title="Upload MRI Scan"
              description="Upload your brain MRI scan in common image formats (JPEG, PNG)"
            />
            <Step
              number="2"
              gradient="from-purple-500 to-pink-500"
              title="AI Analysis"
              description="Our deep learning model analyzes the scan and identifies potential tumors"
            />
            <Step
              number="3"
              gradient="from-emerald-500 to-teal-500"
              title="Get Results"
              description="Receive detailed results with confidence scores and treatment recommendations"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-300% animate-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of healthcare professionals using our AI-powered diagnostic system
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold hover:bg-gray-100 transition-all shadow-xl hover:scale-105 transform"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm">
            © 2024 NeuroScout - Brain Tumor Detection System. All rights reserved.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
        .bg-300\\% {
          background-size: 300% 300%;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </main>
  );
}

function FeatureCard({ icon, title, description, gradient }: {
  icon: React.ReactNode,
  title: string,
  description: string,
  gradient: string
}) {
  return (
    <div className="group p-6 rounded-2xl bg-white border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      <div className={`mb-4 p-4 rounded-xl bg-gradient-to-br ${gradient} w-fit group-hover:scale-110 transition-transform shadow-lg`}>
        <div className="text-white">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({ number, title, description, gradient }: {
  number: string,
  title: string,
  description: string,
  gradient: string
}) {
  return (
    <div className="text-center group">
      <div className={`mb-4 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform`}>
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

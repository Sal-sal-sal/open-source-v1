/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useStarInteraction } from '../hooks/useStarInteraction';
import Stars from '../components/Effects/Stars';
import { Headphones, Play, BookOpen, Brain, Sparkles, ArrowRight, Download, Volume2, Zap, Target, Users, TrendingUp } from 'lucide-react';

// Firebase Realtime Database base URL (can be overridden via Vite env var)
const FIREBASE_URL = import.meta.env.VITE_FIREBASE_URL || 'https://landing-44432-default-rtdb.firebaseio.com';

const AnimatedSection: React.FC<{children: React.ReactNode, className?: string, id?: string}> = ({ children, className, id }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.4,
  });

  return (
    <section ref={ref} id={id} className={`${className} fade-in-up ${inView ? 'is-visible' : ''}`}>
      {children}
    </section>
  );
};

const PhoneIcon: React.FC = () => {
  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-2 shadow-2xl border border-gray-700">
        {/* Phone Screen */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-[2.5rem] w-80 h-[600px] relative overflow-hidden">
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 py-3 text-white text-sm">
            <span>9:41</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-2 bg-white rounded-sm"></div>
              <div className="w-6 h-2 bg-white rounded-sm"></div>
            </div>
          </div>
          
          {/* App Content */}
          <div className="px-6 py-4 h-full flex flex-col">
            {/* App Header */}
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-bold">LearnTug</h3>
              <p className="text-white/80 text-sm">AI-Powered Learning</p>
            </div>
            
            {/* Audio Waveform Animation */}
            <div className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-1 h-20">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-full w-1 animate-pulse"
                    style={{
                      height: `${Math.random() * 60 + 20}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: `${800 + Math.random() * 400}ms`
                    }}
                  />
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-white/90 text-sm font-medium">Analyzing Audio...</p>
                <p className="text-white/70 text-xs">Creating AI Notes</p>
              </div>
            </div>
            
            {/* Play Button */}
            <div className="text-center mb-6">
              <button className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-all duration-300 backdrop-blur-sm">
                <Play className="h-8 w-8 text-white fill-white" />
              </button>
            </div>
            
            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-4 mt-auto mb-6">
              <div className="text-center">
                <div className="bg-white/10 rounded-xl p-3 mb-2">
                  <Headphones className="h-6 w-6 text-white mx-auto" />
                </div>
                <p className="text-white/80 text-xs">Listen</p>
              </div>
              <div className="text-center">
                <div className="bg-white/10 rounded-xl p-3 mb-2">
                  <Brain className="h-6 w-6 text-white mx-auto" />
                </div>
                <p className="text-white/80 text-xs">AI Notes</p>
              </div>
              <div className="text-center">
                <div className="bg-white/10 rounded-xl p-3 mb-2">
                  <BookOpen className="h-6 w-6 text-white mx-auto" />
                </div>
                <p className="text-white/80 text-xs">Learn</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Home Button */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full"></div>
      </div>
      
      {/* Floating Audio Waves */}
      <div className="absolute -top-4 -right-4 animate-bounce">
        <Volume2 className="h-8 w-8 text-purple-400" />
      </div>
      <div className="absolute -bottom-4 -left-4 animate-pulse">
        <Sparkles className="h-6 w-6 text-blue-400" />
      </div>
    </div>
  );
};

const FeaturesIllustration: React.FC = () => {
  return (
    <div className="relative">
      {/* Main Feature Dashboard */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-3">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-white text-xl font-bold">AI Dashboard</h3>
              <p className="text-gray-400 text-sm">Learning Analytics</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-400 text-sm font-medium">+24% Today</div>
            <div className="text-gray-500 text-xs">Learning Progress</div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Smart Processing */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl p-4 border border-purple-500/30">
            <div className="flex items-center space-x-3 mb-3">
              <Zap className="h-6 w-6 text-purple-400" />
              <span className="text-white font-medium text-sm">Smart Processing</span>
            </div>
            <div className="text-purple-300 text-2xl font-bold">98.5%</div>
            <div className="text-gray-400 text-xs">Accuracy Rate</div>
          </div>

          {/* AI Notes */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-4 border border-blue-500/30">
            <div className="flex items-center space-x-3 mb-3">
              <Target className="h-6 w-6 text-blue-400" />
              <span className="text-white font-medium text-sm">AI Notes</span>
            </div>
            <div className="text-blue-300 text-2xl font-bold">1.2K</div>
            <div className="text-gray-400 text-xs">Generated Today</div>
          </div>

          {/* Active Users */}
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl p-4 border border-green-500/30">
            <div className="flex items-center space-x-3 mb-3">
              <Users className="h-6 w-6 text-green-400" />
              <span className="text-white font-medium text-sm">Active Users</span>
            </div>
            <div className="text-green-300 text-2xl font-bold">15.7K</div>
            <div className="text-gray-400 text-xs">This Month</div>
          </div>

          {/* Growth */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-800/20 rounded-2xl p-4 border border-yellow-500/30">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
              <span className="text-white font-medium text-sm">Growth</span>
            </div>
            <div className="text-yellow-300 text-2xl font-bold">+156%</div>
            <div className="text-gray-400 text-xs">Last Quarter</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Audio Processing</span>
              <span className="text-purple-400">94%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '94%'}}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Note Generation</span>
              <span className="text-blue-400">87%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '87%'}}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">User Satisfaction</span>
              <span className="text-green-400">98%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '98%'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-6 -right-6 animate-bounce">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
      </div>
      
      <div className="absolute -bottom-6 -left-6 animate-pulse">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-3">
          <Zap className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const FAQIllustration: React.FC = () => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-3">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-white text-xl font-bold">Help Center</h3>
            <p className="text-gray-400 text-sm">Your guide to mastering LearnTug</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-400 text-sm font-medium">+24% Today</div>
          <div className="text-gray-500 text-xs">Support Tickets</div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Quick Support */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl p-4 border border-purple-500/30">
          <div className="flex items-center space-x-3 mb-3">
            <Headphones className="h-6 w-6 text-purple-400" />
            <span className="text-white font-medium text-sm">Quick Support</span>
          </div>
          <div className="text-purple-300 text-2xl font-bold">98.5%</div>
          <div className="text-gray-400 text-xs">Resolution Rate</div>
        </div>

        {/* 24/7 Help Center */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-4 border border-blue-500/30">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="h-6 w-6 text-blue-400" />
            <span className="text-white font-medium text-sm">24/7 Help Center</span>
          </div>
          <div className="text-blue-300 text-2xl font-bold">1.2K</div>
          <div className="text-gray-400 text-xs">Tickets This Month</div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl p-4 border border-green-500/30">
          <div className="flex items-center space-x-3 mb-3">
            <Sparkles className="h-6 w-6 text-green-400" />
            <span className="text-white font-medium text-sm">Getting Started</span>
          </div>
          <div className="text-green-300 text-2xl font-bold">15.7K</div>
          <div className="text-gray-400 text-xs">Users This Month</div>
        </div>

        {/* Growth */}
        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-800/20 rounded-2xl p-4 border border-yellow-500/30">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="h-6 w-6 text-yellow-400" />
            <span className="text-white font-medium text-sm">Growth</span>
          </div>
          <div className="text-yellow-300 text-2xl font-bold">+156%</div>
          <div className="text-gray-400 text-xs">Last Quarter</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">Resolution Rate</span>
            <span className="text-purple-400">94%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '94%'}}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">Ticket Volume</span>
            <span className="text-blue-400">87%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '87%'}}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">User Satisfaction</span>
            <span className="text-green-400">98%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '98%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const constellationsRef = useRef<HTMLDivElement>(null);

  useStarInteraction(constellationsRef, {
    attractionFactor: 0.1,
    interactionRadius: 300,
  });

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const emailInput = (form.elements.namedItem('email') as HTMLInputElement) || { value: '' };
    const email = emailInput.value;
    try {
        const response = await fetch(`${FIREBASE_URL}/subscribers.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            const data = await response.json();
            alert(`Error: ${data.detail || 'Subscription failed'}`);
        } else {
            alert('Successfully subscribed!');
            form.reset();
        }
    } catch (error) {
        console.error('Subscription error:', error);
        alert('Failed to subscribe. Please try again later.');
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    { q: 'What is LearnTug?', a: 'LearnTug is an AI-powered platform that transforms your audio content into interactive learning experiences with automatically generated smart notes.' },
    { q: 'How does it work?', a: 'Simply upload your audio file or paste a link. Our AI analyzes the content and creates comprehensive notes, summaries, and interactive elements to enhance your learning.' },
    { q: 'What audio formats are supported?', a: 'We support MP3, WAV, M4A, and most common audio formats. You can also paste YouTube links or other audio URLs.' },
    { q: 'How accurate are the AI notes?', a: 'Our AI uses advanced language models trained on educational content to provide highly accurate and contextual notes. The system continuously improves based on user feedback.' },
    { q: 'Can I edit the generated notes?', a: 'Yes! All generated notes are fully editable. You can modify, add, or remove content to personalize your learning experience.' },
    { q: 'Is there a mobile app?', a: 'Yes, LearnTug works as a Progressive Web App (PWA) on your mobile device. You can install it directly from your browser for a native app-like experience.' },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-purple-900 text-gray-200 font-sans min-h-screen">
      <Stars />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-gray-800/50">
        <div className="container mx-auto flex justify-between items-center p-4">
          <a href="#welcome" className="text-2xl font-bold text-purple-400 flex items-center space-x-2">
            <Brain className="h-8 w-8" />
            <span>LearnTug</span>
          </a>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="hover:text-purple-400 transition-colors">Home</a>
            <a href="/chat" className="hover:text-purple-400 transition-colors">Chat</a>
            <a href="/library" className="hover:text-purple-400 transition-colors">Library</a>
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#faq" className="hover:text-purple-400 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="/login" className="hover:text-purple-400 transition-colors">Sign In</a>
            <a href="/register" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="welcome" className="min-h-screen flex items-center py-20 px-4 relative overflow-hidden">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Description */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                    Transform Audio into
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Smart Learning</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                    Upload your audio files and get instant audiobooks with
                    <span className="text-purple-400 font-semibold"> AI-powered notes</span> that adapt to your learning style.
                  </p>
                </div>
                
                {/* Feature Highlights */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-600 rounded-full p-2">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg">Upload any audio file instantly</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 rounded-full p-2">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg">AI analyzes and creates smart notes</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-600 rounded-full p-2">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg">Powered by advanced AI technology</span>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <a 
                    href="/register" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-lg"
                  >
                    <span>Start Learning Now</span>
                    <ArrowRight className="h-5 w-5" />
                  </a>
                  
                  <a 
                    href="/library" 
                    className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 text-lg"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>Browse Library</span>
                  </a>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-700">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">10K+</div>
                    <div className="text-gray-400">Audio Files Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">50K+</div>
                    <div className="text-gray-400">AI Notes Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">98%</div>
                    <div className="text-gray-400">User Satisfaction</div>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Phone Mock-up */}
              <div className="flex justify-center lg:justify-end">
                <PhoneIcon />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Now matching Hero style */}
        <AnimatedSection 
          id="features" 
          className="min-h-screen flex items-center py-20 px-4 relative overflow-hidden"
        >
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - Features Description */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
                    Why Choose 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> LearnTug?</span>
                  </h2>
                  
                  <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                    Experience the future of audio learning with
                    <span className="text-purple-400 font-semibold"> AI-powered insights</span> and intelligent note generation.
                  </p>
                </div>
                
                {/* Feature List */}
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-3 mt-1">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Smart Audio Processing</h3>
                      <p className="text-gray-300">Advanced AI analyzes your audio content and extracts key information automatically with 98.5% accuracy.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-3 mt-1">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Intelligent Notes</h3>
                      <p className="text-gray-300">Get comprehensive notes, summaries, and key insights generated in real-time as you listen.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-3 mt-1">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Collaborative Learning</h3>
                      <p className="text-gray-300">Join 15,7K+ active learners and share insights with our growing community.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-3 mt-1">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Continuous Growth</h3>
                      <p className="text-gray-300">Track your learning progress and see real improvements with our analytics dashboard.</p>
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="pt-4">
                  <a 
                    href="/register" 
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg"
                  >
                    <span>Try It Free</span>
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              {/* Right Side - Features Illustration */}
              <div className="flex justify-center lg:justify-end">
                <FeaturesIllustration />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* FAQ Section */}
        <AnimatedSection id="faq" className="min-h-screen flex items-center py-20 px-4">
          <div className="container mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Side - FAQ Description */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
                    Got 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Questions?</span>
                  </h2>
                  
                  <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                    Everything you need to know about
                    <span className="text-purple-400 font-semibold"> LearnTug</span> and how it transforms your learning experience.
                  </p>
                </div>
                
                {/* FAQ Preview */}
                <div className="space-y-4">
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">Quick Support</h3>
                    <p className="text-gray-300 text-sm">Get instant answers to common questions about LearnTug's features and functionality.</p>
                  </div>
                  
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">24/7 Help Center</h3>
                    <p className="text-gray-300 text-sm">Our comprehensive help center is available around the clock to assist you.</p>
                  </div>
                  
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">Getting Started</h3>
                    <p className="text-gray-300 text-sm">Step-by-step guides to help you make the most of your LearnTug experience.</p>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="pt-4">
                  <a 
                    href="https://t.me/sabomust" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg"
                  >
                    <span>Contact Me</span>
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              {/* Right Side - FAQ Content */}
              <div className="space-y-6">
                <div className="mb-8">
                  <FAQIllustration />
                </div>
                
                <div className="space-y-4">
                  {faqs.slice(0, 4).map((faq, index) => (
                    <div key={index} className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden backdrop-blur-sm hover:border-purple-500 transition-all duration-300">
                      <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center text-left p-4 font-semibold text-lg text-white hover:bg-gray-700/50 transition-colors">
                        <span className="text-base">{faq.q}</span>
                        <span className={`transform transition-transform duration-300 ${openFaq === index ? 'rotate-45' : ''} text-purple-400`}>+</span>
                      </button>
                      {openFaq === index && (
                        <div className="p-4 pt-0 text-gray-300 border-t border-gray-700 text-sm">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="text-center pt-4">
                    <button className="text-purple-400 hover:text-purple-300 font-medium text-sm flex items-center space-x-2 mx-auto">
                      <span>View All {faqs.length} Questions</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-black/50">
        <div className="container mx-auto p-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <Brain className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">LearnTug</span>
            </div>
            <p className="text-gray-400 mb-6">Transform your audio into intelligent learning experiences</p>
          </div>
          
          <div className="text-center text-gray-500 pt-8 border-t border-gray-800">
            &copy; 2025 LearnTug. All rights reserved. Powered by AI.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

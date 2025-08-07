/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useStarInteraction } from '../hooks/useStarInteraction';
import Stars from '../components/Effects/Stars';
import CommonHeader from '../components/CommonHeader';
import { Headphones, Play, BookOpen, Brain, Sparkles, ArrowRight, Download, Volume2, Zap, Target, Users, TrendingUp } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import FAQSection from '../components/landing/FAQSection';

// Firebase Realtime Database base URL (can be overridden via Vite env var)
const FIREBASE_URL = import.meta.env.VITE_FIREBASE_URL || 'https://landing-44432-default-rtdb.firebaseio.com';





const FeaturesIllustration: React.FC = () => {
  return (
    <div className="relative">
      {/* Main Feature Dashboard */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-start mb-8">
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
    <div className="bg-black text-gray-200 font-sans min-h-screen">
      <Stars />
      
      {/* Header */}
      <CommonHeader currentPage="landing" />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Features Cards Section */}
        <FeaturesSection />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
        <footer className="bg-black/90 border-t border-gray-800/50">
          <div className="container mx-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Company Info */}
              <div className="md:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-2">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">LearnTug</span>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  AI-powered learning platform that transforms your audio content into intelligent learning experiences with automatically generated smart notes.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>support@learntug.com</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>@learntug_support</span>
                  </div>
                </div>
              </div>

              {/* Product */}
              <div>
                <h3 className="text-white font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Docs</a></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-white font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Press Kit</a></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-white font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GDPR</a></li>
                </ul>
              </div>
            </div>
            
            <div className="text-center text-gray-500 pt-8 border-t border-gray-800 mt-8">
              &copy; 2025 LearnTug. All rights reserved. Powered by AI.
            </div>
          </div>
        </footer>
    </div>
  );
};

export default LandingPage;

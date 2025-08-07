import React from 'react';
import { Brain, Sparkles, Users, TrendingUp } from 'lucide-react';
import AnimatedElement from './AnimatedElement';
import AnimatedSection from './AnimatedSection';

const FeaturesSection: React.FC = () => {
  return (
    <AnimatedSection id="features-cards" className="min-h-screen flex items-center py-20 px-4">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <AnimatedElement delay={200}>
            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Powerful
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Features</span>
            </h2>
          </AnimatedElement>
          
          <AnimatedElement delay={400}>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Everything you need to transform your learning experience with AI-powered tools and intelligent automation.
            </p>
          </AnimatedElement>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <AnimatedElement delay={400}>
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-purple-500 transition-all duration-300 min-h-[280px] hover:bg-gray-800/95 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:from-purple-500 group-hover:to-purple-600 transition-all duration-300">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-100 transition-colors duration-300">AI Analysis</h3>
                <p className="text-gray-300 text-base leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Advanced machine learning extracts key insights and tasks automatically from your audio content.
                </p>
              </div>
            </div>
          </AnimatedElement>

          <AnimatedElement delay={600}>
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-blue-500 transition-all duration-300 min-h-[280px] hover:bg-gray-800/95 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-100 transition-colors duration-300">Smart Formatting</h3>
                <p className="text-gray-300 text-base leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Professional summaries with proper structure, bullets, and highlighted decisions for better understanding.
                </p>
              </div>
            </div>
          </AnimatedElement>

          <AnimatedElement delay={800}>
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-green-500 transition-all duration-300 min-h-[280px] hover:bg-gray-800/95 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:from-green-500 group-hover:to-green-600 transition-all duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-100 transition-colors duration-300">Instant Sharing</h3>
                <p className="text-gray-300 text-base leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  One-click distribution to your team, stakeholders, or favorite productivity tools for seamless collaboration.
                </p>
              </div>
            </div>
          </AnimatedElement>

          <AnimatedElement delay={1000}>
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50 hover:border-yellow-500 transition-all duration-300 min-h-[280px] hover:bg-gray-800/95 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/20 cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:from-yellow-500 group-hover:to-orange-500 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-100 transition-colors duration-300">Searchable Archive</h3>
                <p className="text-gray-300 text-base leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  Find any discussion, decision, or detail from past learning sessions with powerful search capabilities.
                </p>
              </div>
            </div>
          </AnimatedElement>
        </div>

        <AnimatedElement delay={1200}>
          <div className="text-center mt-12">
            <a 
              href="/register" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg"
            >
              <span>Start Learning Now</span>
            </a>
          </div>
        </AnimatedElement>
      </div>
    </AnimatedSection>
  );
};

export default FeaturesSection; 
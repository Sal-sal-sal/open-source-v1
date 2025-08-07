import React from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import AnimatedElement from './AnimatedElement';

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-700 via-blue-800 to-transparent h-screen"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">


          <AnimatedElement delay={400}>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Everything you need for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> better learning</span>
            </h1>
          </AnimatedElement>

          <AnimatedElement delay={600}>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8 max-w-3xl mx-auto">
              Transform your learning workflow with intelligent automation and seamless integration. 
              From audio analysis to smart notes, we've got you covered.
            </p>
          </AnimatedElement>

          <AnimatedElement delay={800}>
            <div className="flex justify-center items-center">
              <a 
                href="/register" 
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 text-lg"
              >
                <span>Start Learning Now</span>
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 
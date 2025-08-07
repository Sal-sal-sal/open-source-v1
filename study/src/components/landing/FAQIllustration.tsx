import React from 'react';

const FAQIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-64 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-2xl"></div>
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Need Help?</h3>
          <p className="text-gray-300 text-sm">We're here to help you succeed</p>
        </div>
      </div>
    </div>
  );
};

export default FAQIllustration; 
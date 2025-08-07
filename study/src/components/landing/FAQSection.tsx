import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import AnimatedElement from './AnimatedElement';
import AnimatedSection from './AnimatedSection';
import FAQIllustration from './FAQIllustration';

interface FAQ {
  q: string;
  a: string;
}

const faqs: FAQ[] = [
  {
    q: "What is LearnTug?",
    a: "LearnTug is an AI-powered learning platform that helps you transform audio content into structured notes, insights, and actionable learning materials."
  },
  {
    q: "How does the AI analysis work?",
    a: "Our advanced machine learning algorithms analyze your audio content to extract key insights, important points, and create structured summaries automatically."
  },
  {
    q: "Can I share my notes with others?",
    a: "Yes! You can easily share your AI-generated notes with your team, classmates, or anyone you choose with just one click."
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use enterprise-grade security measures to protect your data and ensure your privacy is maintained at all times."
  },
  {
    q: "What audio formats are supported?",
    a: "We support all major audio formats including MP3, WAV, M4A, and more. You can upload files directly or record audio within the platform."
  },
  {
    q: "Can I search through my old notes?",
    a: "Yes! Our powerful search functionality allows you to find any discussion, decision, or detail from your past learning sessions instantly."
  }
];

const FAQSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <AnimatedSection id="faq" className="py-20 px-4">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12">
          <AnimatedElement delay={200}>
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/20">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-medium">Frequently Asked Questions</span>
            </div>
          </AnimatedElement>
          
          <AnimatedElement delay={400}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </AnimatedElement>
          
          <AnimatedElement delay={600}>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Answers to the most popular questions about our service
            </p>
          </AnimatedElement>
        </div>
        
                 <div className="max-w-5xl mx-auto">
           <div className="space-y-6">
             {faqs.map((faq, index) => (
               <AnimatedElement key={index} delay={800 + index * 100}>
                 <div className="bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden">
                   <button 
                     onClick={() => toggleFaq(index)} 
                     className="w-full flex items-center justify-between p-8 text-left hover:bg-gray-700/50 transition-colors"
                   >
                     <div className="flex items-center space-x-6">
                       <div className="bg-blue-500/20 rounded-lg p-3">
                         {index === 0 && (
                           <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                         )}
                         {index === 1 && (
                           <svg className="h-6 w-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                           </svg>
                         )}
                         {index === 2 && (
                           <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                           </svg>
                         )}
                         {index === 3 && (
                           <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                           </svg>
                         )}
                         {index === 4 && (
                           <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                           </svg>
                         )}
                         {index === 5 && (
                           <svg className="h-6 w-6 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                             <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                           </svg>
                         )}
                       </div>
                       <span className="text-white font-medium text-lg">{faq.q}</span>
                     </div>
                     <svg 
                       className={`h-6 w-6 text-white transform transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                       fill="none" 
                       stroke="currentColor" 
                       viewBox="0 0 24 24"
                     >
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </button>
                   {openFaq === index && (
                     <div className="px-8 pb-8 text-gray-300 border-t border-gray-700">
                       <p className="pt-4 text-base">{faq.a}</p>
                     </div>
                   )}
                 </div>
               </AnimatedElement>
             ))}
           </div>
         </div>
      </div>
    </AnimatedSection>
  );
};

export default FAQSection; 
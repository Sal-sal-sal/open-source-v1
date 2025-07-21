/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useStarInteraction } from '../hooks/useStarInteraction';

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

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
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
    { q: 'What is ScienceAI?', a: 'ScienceAI is a platform that uses advanced artificial intelligence to understand scientific concepts and automatically generate educational games to explain them.' },
    { q: 'Who is this for?', a: 'It\'s for educators, students, and anyone with a curiosity for science. It simplifies complex topics through interactive gameplay, making learning engaging and effective.' },
    { q: 'What kind of topics can it handle?', a: 'From quantum physics to cellular biology, our AI is trained on a vast corpus of scientific literature. You can create a game to explain almost any scientific domain.' },
    { q: 'How exactly does it work?', a: 'You provide a task and a scientific topic. Our AI then consults a knowledge base of educational materials and autonomously designs and builds an interactive game to explain that topic.' },
    { q: 'What will the pricing be?', a: 'We are planning a range of subscription tiers to suit different needs, with prices expected to be between $7 and $29 per month.' },
    { q: 'How can I get in touch?', a: 'You can contact us at saladinnado@gmail.com.' },
    
  ];

  return (
    <div className="bg-black text-gray-200 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto flex justify-between items-center p-4">
          <a href="#welcome" className="text-2xl font-bold text-cyan-400">ScienceAI</a>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="hover:text-cyan-400 transition-colors">Home</a>
            <a href="/chat" className="hover:text-cyan-400 transition-colors">Chat</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
            <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="/login" className="hover:text-cyan-400 transition-colors">Sign In</a>
            <a href="/register" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg transition-colors">
              Sign Up
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Welcome Section */}
        <section id="welcome" className="relative h-screen flex flex-col justify-center items-center text-center p-4 overflow-hidden">
          {/* Background audio synced with video */}
          <audio
            ref={audioRef}
            src="/resurses/oppenheimer.mp3"
            autoPlay
            loop
            muted={isMuted}
            preload="auto"
            onEnded={() => audioRef.current?.play()}
            style={{ display: 'none' }}
          />

          <video
            ref={videoRef}
            preload="auto"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onEnded={() => videoRef.current?.play()}
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="/resurses/oppenheimer.mp4"
          >
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/60 z-10 border-b border-gray-800"></div>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-5 right-5 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
          </button>
          
          <div className="relative z-20 flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight">
              Welcome to the Future of <span className="text-cyan-400">Science Education</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mb-8 ">
              Load your document, wait a bit , Get your feedback from AI and ask questions about what you read.
            </p>
          </div>
        </section>

        {/* Importance of ScienceAI (Features) & FAQ Section */}
        <div className="starfield-bg relative" ref={constellationsRef}>
          <div className="stars stars1"></div>
          <div className="stars stars2"></div>
          
          {/* Animated constellations */}
          <div className="constellations">
            {/* Constellation Orion */}
            <div className="constellation-group constellation-orion">
              <div className="constellation-group-inner">
                {/* Main stars of Orion */}
                <div className="constellation star-bright star-betelgeuse">
                  <span className="star-name">Betelgeuse</span>
                </div>
                <div className="constellation star-bright star-rigel">
                  <span className="star-name">Rigel</span>
                </div>
                <div className="constellation star-medium star-bellatrix">
                  <span className="star-name">Bellatrix</span>
                </div>
                <div className="constellation star-medium star-alnitak">
                  <span className="star-name">Alnitak</span>
                </div>
                <div className="constellation star-bright star-alnilam">
                  <span className="star-name">Alnilam</span>
                </div>
                <div className="constellation star-medium star-mintaka">
                  <span className="star-name">Mintaka</span>
                </div>
                <div className="constellation star-dim star-saiph">
                  <span className="star-name">Saiph</span>
                </div>

                {/* Orion's belt */}
                <div className="constellation-line line-belt1"></div>
                <div className="constellation-line line-belt2"></div>

                {/* Orion's body */}
                <div className="constellation-line line-shoulder1"></div>
                <div className="constellation-line line-body1"></div>
                <div className="constellation-line line-body2"></div>
                <div className="constellation-line line-leg1"></div>
                <div className="constellation-line line-leg2"></div>
              </div>
            </div>
            
            {/* Constellation Leo */}
            <div className="constellation-group constellation-leo">
              <div className="constellation-group-inner">
                {/* Main stars of Leo */}
                <div className="constellation star-bright star-regulus">
                  <span className="star-name">Regulus</span>
                </div>
                <div className="constellation star-medium star-denebola">
                  <span className="star-name">Denebola</span>
                </div>
                <div className="constellation star-bright star-algieba">
                  <span className="star-name">Algieba</span>
                </div>
                <div className="constellation star-medium star-zosma">
                  <span className="star-name">Zosma</span>
                </div>
                <div className="constellation star-dim star-chertan">
                  <span className="star-name">Chertan</span>
                </div>
                <div className="constellation star-dim star-adhafera">
                  <span className="star-name">Adhafera</span>
                </div>

                {/* Leo's sickle (head) */}
                <div className="constellation-line line-sickle1"></div>
                <div className="constellation-line line-sickle2"></div>
                <div className="constellation-line line-sickle3"></div>

                {/* Leo's body */}
                <div className="constellation-line line-body1"></div>
                <div className="constellation-line line-body2"></div>
                <div className="constellation-line line-body3"></div>
              </div>
            </div>
            
            {/* Constellation Ursa Major (Big Dipper) */}
            <div className="constellation-group constellation-ursa-major">
              {/* Main stars of the Big Dipper */}
              <div className="constellation star-bright star-dubhe"><span className="star-name">Dubhe</span></div>
              <div className="constellation star-medium star-merak"><span className="star-name">Merak</span></div>
              <div className="constellation star-medium star-phecda"><span className="star-name">Phecda</span></div>
              <div className="constellation star-dim star-megrez"><span className="star-name">Megrez</span></div>
              <div className="constellation star-bright star-alioth"><span className="star-name">Alioth</span></div>
              <div className="constellation star-medium star-mizar"><span className="star-name">Mizar</span></div>
              <div className="constellation star-bright star-alkaid"><span className="star-name">Alkaid</span></div>

              {/* Ursa Major's connections */}
              <div className="constellation-line line-1"></div>
              <div className="constellation-line line-2"></div>
              <div className="constellation-line line-3"></div>
              <div className="constellation-line line-4"></div>
              <div className="constellation-line line-5"></div>
              <div className="constellation-line line-6"></div>
              <div className="constellation-line line-7"></div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-black/50"></div>

          {/* All content goes into a relative container to sit above the overlay */}
          <div className="relative">
            {/* Importance of ScienceAI (Features) Section */}
            <AnimatedSection 
              id="features" 
              className="min-h-screen py-20 px-4 flex flex-col justify-center items-center"
            >
              <div className="container mx-auto text-center relative z-10">
                <h2 className="text-4xl font-bold mb-12 text-white">The Next Generation of Interactive Learning</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="p-6 rounded-lg border border-slate-800">
                    <div className="text-5xl mb-4">🧬</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Instant Game Creation</h3>
                    <p className="text-slate-300">Generate complete educational games from a single scientific prompt.</p>
                  </div>
                  <div className="p-6 rounded-lg border border-slate-800">
                    <div className="text-5xl mb-4">🔬</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Deep Scientific Understanding</h3>
                    <p className="text-slate-300">Our AI understands complex scientific papers, theories, and data.</p>
                  </div>
                  <div className="p-6 rounded-lg border border-slate-800">
                    <div className="text-5xl mb-4">🎮</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Interactive Explanations</h3>
                    <p className="text-slate-300">Transform dense topics into playable experiences that are easy to grasp.</p>
                  </div>
                  <div className="p-6 rounded-lg border border-slate-800">
                    <div className="text-5xl mb-4">🧑‍🏫</div>
                    <h3 className="text-2xl font-bold mb-2 text-white">For Educators & Students</h3>
                    <p className="text-slate-300">A powerful tool for creating engaging lesson plans and for self-directed learning.</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* FAQ Section */}
            <AnimatedSection id="faq" className="pb-20 px-4">
              <div className="container mx-auto max-w-4xl relative z-10">
                <h2 className="text-4xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="bg-slate-900/30 border border-slate-900 rounded-lg overflow-hidden backdrop-blur-sm ">
                      <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center text-left p-6 font-semibold text-lg text-white hover:bg-slate-700/50 transition-colors">
                        <span>{faq.q}</span>
                        <span className={`transform transition-transform duration-300 ${openFaq === index ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      {openFaq === index && (
                        <div className="p-6 pt-0 text-gray-300">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* About Section */}
        <AnimatedSection id="about" className="py-20 px-4 bg-gray-900">
          <div className="container mx-auto text-center max-w-4xl">
            <h2 className="text-4xl font-bold mb-12 text-white">About ScienceAI</h2>
            <p className="text-lg text-gray-400 mb-6">
              Our mission is to make science accessible and engaging for everyone through the power of AI-driven interactive experiences.
            </p>
            <div className="flex justify-center items-center space-x-6 text-gray-500 mb-6">
              <div className="flex space-x-4">
                <a href="https://github.com/Sal-sal-sal" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">GitHub</a>
                <a href="https://www.linkedin.com/in/saladin-nadirov-b7393735a/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">LinkedIn</a>
                <a href="mailto:saladinnado@gmail.com" className="hover:text-cyan-400 transition-colors">Gmail</a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="container mx-auto p-8">
          <div className="grid md:grid-cols-3 gap-8">

          </div>
          <div className="text-center text-gray-500 mt-8 pt-8 border-t border-gray-800">
            &copy; 2025 ScienceAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

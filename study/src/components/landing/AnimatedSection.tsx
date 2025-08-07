import React from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  id, 
  className = "" 
}) => {
  const [ref, inView] = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      id={id}
      className={`transition-all duration-1000 ease-out ${
        inView 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      } ${className}`}
    >
      {children}
    </section>
  );
};

export default AnimatedSection; 
import React from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedElementProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const AnimatedElement: React.FC<AnimatedElementProps> = ({ 
  children, 
  delay = 0, 
  className = "" 
}) => {
  const [ref, inView] = useInView({
    threshold: 0.7,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedElement; 
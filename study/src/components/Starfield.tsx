import React, { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  opacity: number;
  radius: number;
  shineOffset: number;
}

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stars = useRef<Star[]>([]);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numStars = 800;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initialize stars
    if (stars.current.length === 0) {
      for (let i = 0; i < numStars; i++) {
        stars.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * canvas.width,
          opacity: Math.random(),
          radius: Math.random() * 1.5,
          shineOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update time for shine effect
      timeRef.current += 0.016; // ~60fps

      stars.current.forEach(star => {
        star.z -= 1;
        if (star.z <= 0) {
          star.z = canvas.width;
        }

        const scale = canvas.width / star.z;
        const x = (star.x - centerX) * scale + centerX;
        const y = (star.y - centerY) * scale + centerY;
        const radius = star.radius * scale;
        
        // Shine effect with 1-second intervals
        const shineIntensity = (Math.sin((timeRef.current + star.shineOffset) * Math.PI * 2) + 1) / 2;
        const opacity = star.opacity * (0.3 + 0.7 * shineIntensity); // Varies from 30% to 100% of original opacity

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            canvas.width = entry.contentRect.width;
            canvas.height = entry.contentRect.height;
            stars.current = []; // Re-initialize stars on resize
        }
    });
    
    resizeObserver.observe(canvas);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.unobserve(canvas);
    };
  }, []);

  return (
    <canvas 
        ref={canvasRef} 
        className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
};

export default Starfield; 
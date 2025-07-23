import React, { useRef, useEffect } from 'react';

interface Star {
  centerX: number;
  centerY: number;
  radius: number;
  angle: number;
  speed: number;
  size: number;
}

const Stars: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialize stars
    const numStars = 300;
    starsRef.current = [];
    for (let i = 0; i < numStars; i++) {
      const layer = Math.floor(Math.random() * 3); // 0-2 for parallax
      const speed = (0.0005 + (3 - layer) * 0.0003) * (Math.random() + 0.5);
      const orbitRadius = 1500 + Math.random() * 3000;
      const centerX = -canvas.width * 0.5; // Center outside left-top
      const centerY = -canvas.height * 0.5;
      const initialAngle = Math.random() * Math.PI * 2;

      starsRef.current.push({
        centerX,
        centerY,
        radius: orbitRadius,
        angle: initialAngle,
        speed,
        size: 1 + Math.random() * 1.5,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach(star => {
        star.angle += star.speed;
        if (star.angle > Math.PI * 2) star.angle -= Math.PI * 2;

        const x = star.centerX + star.radius * Math.cos(star.angle);
        const y = star.centerY + star.radius * Math.sin(star.angle);

        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          ctx.beginPath();
          ctx.arc(x, y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -10 }}
    />
  );
};

export default Stars;

import React, { useRef, useEffect } from 'react';

interface Star {
  centerX: number;
  centerY: number;
  radius: number;
  angle: number;
  speed: number;
  size: number;
  trail: { x: number; y: number }[];
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
    const trailLength = 5; // Длина следа
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
        trail: []
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

        // Добавляем текущую позицию в начало следа
        star.trail.unshift({ x, y });
        
        // Ограничиваем длину следа
        if (star.trail.length > trailLength) {
          star.trail.pop();
        }

        // Рисуем след
        star.trail.forEach((point, index) => {
          if (point.x >= 0 && point.x <= canvas.width && point.y >= 0 && point.y <= canvas.height) {
            const alpha = (trailLength - index) / trailLength; // Убывающая прозрачность
            const size = star.size * alpha; // Убывающий размер
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.fill();
          }
        });
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
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}
    />
  );
};

export default Stars;

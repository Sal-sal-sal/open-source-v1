import { useState, useEffect, RefObject } from 'react';

interface InteractionOptions {
  attractionFactor?: number;
  interactionRadius?: number;
}

export const useStarInteraction = (
  containerRef: RefObject<HTMLElement | null>,
  options: InteractionOptions = {}
) => {
  const { attractionFactor = 0.05, interactionRadius = 250 } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stars = Array.from(
      container.querySelectorAll<HTMLElement>('.constellation-group')
    );

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = container.getBoundingClientRect();
      const mouseX = clientX - left - width / 2;
      const mouseY = clientY - top - height / 2;

      stars.forEach(star => {
        const starRect = star.getBoundingClientRect();
        const starCenterX = starRect.left + starRect.width / 2 - left;
        const starCenterY = starRect.top + starRect.height / 2 - top;

        const distance = Math.sqrt(
          (clientX - (left + starCenterX)) ** 2 +
          (clientY - (top + starCenterY)) ** 2
        );

        if (distance < interactionRadius) {
          const dx = mouseX - (starCenterX - width / 2);
          const dy = mouseY - (starCenterY - height / 2);

          const pullX = dx * attractionFactor;
          const pullY = dy * attractionFactor;
          
          star.style.transform = `translate(${pullX}px, ${pullY}px)`;
        } else {
          star.style.transform = `translate(0, 0)`;
        }
      });
    };

    const handleMouseLeave = () => {
      stars.forEach(star => {
        star.style.transform = `translate(0, 0)`;
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, attractionFactor, interactionRadius]);
}; 
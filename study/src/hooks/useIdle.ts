import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to detect when a user is idle.
 * @param {number} idleTimeout - The amount of time in milliseconds to wait before considering the user idle.
 * @returns {boolean} - True if the user is idle, false otherwise.
 */
export const useIdle = (idleTimeout = 10000): boolean => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutId = useRef<number | null>(null);

  const resetTimer = () => {
    // If user becomes active, they are no longer idle
    if (isIdle) {
      setIsIdle(false);
    }

    // Clear the previous timeout
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }

    // Set a new timeout
    timeoutId.current = window.setTimeout(() => {
      setIsIdle(true);
    }, idleTimeout);
  };

  useEffect(() => {
    // Set up event listeners
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    const handleEvent = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleEvent);
    });

    // Initial timer start
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [isIdle, idleTimeout]); // Rerun effect if isIdle changes to handle the instant state update

  return isIdle;
}; 
import React, { useEffect, useState, useRef } from 'react';

interface TrailDot {
  x: number;
  y: number;
  opacity: number;
  size: number;
  id: number;
  color: string;
}

interface MouseTrailProps {
  colors?: string[];
  trailLength?: number;
  dotSize?: number;
  dotDecay?: number;
  dotLifetime?: number;
  enabled?: boolean;
}

const MouseTrail: React.FC<MouseTrailProps> = ({
  colors = ['#64B5F6', '#90CAF9', '#BBDEFB'], // Light blue colors
  trailLength = 25,
  dotSize = 8,
  dotDecay = 0.95,
  dotLifetime = 100,
  enabled = true
}) => {
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const counterRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const requestRef = useRef<number>();

  // Throttle mouse movement updates for better performance
  const handleMouseMove = (e: MouseEvent) => {
    if (!enabled) return;
    
    const now = performance.now();
    if (now - lastUpdateTimeRef.current > 5) { // Update every 5ms for smoother trail
      setMousePosition({ x: e.clientX, y: e.clientY });
      lastUpdateTimeRef.current = now;
    }
  };

  useEffect(() => {
    // If not enabled, clear the trail and don't set up listeners
    if (!enabled) {
      setTrail([]);
      return () => {};
    }
    
    // Add mouse move event listener
    window.addEventListener('mousemove', handleMouseMove);
    
    const updateTrail = () => {
      setTrail(prevTrail => {
        // Increment counter for unique IDs
        counterRef.current += 1;
        
        // Add new dot at current mouse position with random color from the array
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newDot = {
          x: mousePosition.x,
          y: mousePosition.y,
          opacity: 0.6, // Lower starting opacity
          size: dotSize * (0.8 + Math.random() * 0.3), // Slight size variation
          id: counterRef.current,
          color: randomColor
        };
        
        // Update existing dots
        const updatedTrail = prevTrail
          .map(dot => ({
            ...dot,
            opacity: dot.opacity * dotDecay,
            size: dot.size * 0.98 // Slower size decay for smoother transition
          }))
          // Remove dots that are too small or transparent
          .filter(dot => dot.opacity > 0.02 && dot.size > 0.5);
        
        // Add new dot only if mouse has moved
        if (prevTrail.length === 0 || 
            (prevTrail[0]?.x !== mousePosition.x || 
             prevTrail[0]?.y !== mousePosition.y)) {
          return [newDot, ...updatedTrail].slice(0, trailLength);
        }
        
        return updatedTrail;
      });
      
      requestRef.current = requestAnimationFrame(updateTrail);
    };
    
    requestRef.current = requestAnimationFrame(updateTrail);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [colors, dotDecay, dotSize, mousePosition.x, mousePosition.y, trailLength, enabled]);
  
  // If not enabled, don't render anything
  if (!enabled) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none', 
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {trail.map((dot) => (
        <div
          key={dot.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            borderRadius: '50%',
            backgroundColor: 'transparent',
            opacity: dot.opacity,
            pointerEvents: 'none',
            transform: `translate(${dot.x - dot.size/2}px, ${dot.y - dot.size/2}px)`,
            boxShadow: `0 0 ${dot.size * 2}px ${dot.color}`,
            transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            border: `1px solid rgba(255, 255, 255, 0.3)`,
            filter: `blur(${(1 - dot.opacity) * 3 + 1}px)`
          }}
        />
      ))}
    </div>
  );
};

export default MouseTrail; 
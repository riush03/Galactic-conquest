
import React from 'react';

interface SpaceshipProps {
  x: number; // 0-100%
  y: number; // 0-100%
  rotation: number; // Degrees
  tilt: { x: number, y: number }; // For 3D feel
  isHyperdrive: boolean;
  moving: boolean;
}

const Spaceship: React.FC<SpaceshipProps> = ({ x, y, rotation, tilt, isHyperdrive, moving }) => {
  return (
    <div 
      className="absolute transition-all duration-300 ease-out z-20 pointer-events-none"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`, 
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        perspective: '1000px'
      }}
    >
      <div 
        className="relative transition-transform duration-300 ease-out"
        style={{ 
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Engine Glow & Trail */}
        <div 
          className={`absolute -left-12 top-1/2 -translate-y-1/2 transition-all duration-500 rounded-full blur-2xl
            ${moving ? 'w-24 h-12 bg-blue-400 opacity-60' : 'w-12 h-6 bg-blue-600 opacity-20'}
            ${isHyperdrive ? 'w-64 scale-y-150 opacity-100' : ''}
          `} 
        />
        
        {/* Animated Thrusters */}
        {(moving || isHyperdrive) && (
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4">
             <div className={`h-1 bg-blue-300 rounded-full animate-pulse transition-all ${isHyperdrive ? 'w-32' : 'w-12'}`} />
             <div className={`h-1 bg-blue-300 rounded-full animate-pulse transition-all delay-75 ${isHyperdrive ? 'w-32' : 'w-12'}`} />
          </div>
        )}

        {/* Ship Body - 3D Styled SVG */}
        <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          {/* Main Hull */}
          <path d="M5 25L25 5H75L95 25L75 45H25L5 25Z" fill="#0f172a" stroke="#3b82f6" strokeWidth="2"/>
          {/* Cockpit */}
          <path d="M60 15L85 25L60 35V15Z" fill="#1e40af" fillOpacity="0.8" stroke="#60a5fa" />
          {/* Details */}
          <rect x="30" y="10" width="5" height="30" fill="#3b82f6" fillOpacity="0.3" />
          <rect x="45" y="10" width="5" height="30" fill="#3b82f6" fillOpacity="0.3" />
          {/* Highlight Line */}
          <path d="M25 25H75" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
        </svg>

        {/* Wing Tip Lights */}
        <div className="absolute top-0 right-1/4 w-1 h-1 bg-red-500 rounded-full animate-ping" />
        <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-green-500 rounded-full animate-ping" />
      </div>
    </div>
  );
};

export default Spaceship;

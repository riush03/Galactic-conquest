
import React, { useState, useEffect } from 'react';

interface WarpOverlayProps {
  destinationName: string;
}

const WarpOverlay: React.FC<WarpOverlayProps> = ({ destinationName }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 4500;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(nextProgress);
      if (nextProgress >= 100) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none flex flex-col items-center justify-center bg-cyan-950/10">
      {/* Central Velocity Text */}
      <div className="flex flex-col items-center animate-pulse">
        <div className="text-[12px] font-black text-cyan-400 uppercase tracking-[1.5em] mb-4 opacity-60">Warp Velocity: 9.98c</div>
        <h2 className="text-9xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_0_50px_rgba(6,182,212,0.8)]">Hyperdrive</h2>
        <div className="text-2xl font-mono text-cyan-500 uppercase tracking-[0.8em] mt-4">Destination: {destinationName}</div>
      </div>

      {/* Progress Bar Container */}
      <div className="absolute bottom-40 w-full max-w-4xl px-12">
        <div className="flex justify-between items-end mb-6">
          <div className="text-[11px] font-black uppercase tracking-widest text-cyan-400 opacity-60">Transit Progress</div>
          <div className="text-3xl font-mono text-white">{Math.floor(progress)}%</div>
        </div>
        <div className="h-4 w-full bg-slate-950/80 rounded-full border border-cyan-500/20 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,1)]">
          <div 
            className="h-full bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,1)] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Sector Origin</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Target Orbit</span>
        </div>
      </div>

      {/* Speed Streaks Overlay */}
      <div className="absolute inset-0 opacity-20 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white h-1 rounded-full animate-[warpLine_0.8s_infinite_linear]"
              style={{
                top: `${Math.random() * 100}%`,
                left: '-10%',
                width: `${20 + Math.random() * 30}%`,
                opacity: 0.1 + Math.random() * 0.4,
                animationDelay: `${Math.random() * 1}s`
              }}
            />
          ))}
      </div>

      <style>{`
        @keyframes warpLine {
          from { transform: translateX(0); }
          to { transform: translateX(200vw); }
        }
      `}</style>
    </div>
  );
};

export default WarpOverlay;

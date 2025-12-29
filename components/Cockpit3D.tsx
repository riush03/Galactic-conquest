
import React from 'react';

interface Cockpit3DProps {
  tilt: { x: number, y: number };
  isHyperdrive: boolean;
}

const Cockpit3D: React.FC<Cockpit3DProps> = ({ tilt, isHyperdrive }) => {
  // We use CSS transforms to create a 3D tilting cockpit feel
  const cockpitTiltX = tilt.y * 15;
  const cockpitTiltY = tilt.x * 15;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden">
      <div 
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{ 
          transform: `perspective(1000px) rotateX(${cockpitTiltX}deg) rotateY(${cockpitTiltY}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Main Cockpit Frame */}
        <div className="absolute inset-0 border-[40px] border-slate-900/40 rounded-[100px] shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]" />
        
        {/* Left Console */}
        <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-gradient-to-tr from-slate-950 to-slate-900/80 border-t border-r border-white/10 rounded-tr-[100px] p-8 flex flex-col justify-end gap-4 shadow-2xl">
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${i < 3 ? 'bg-cyan-500 animate-pulse' : 'bg-slate-800'}`} />
            ))}
          </div>
          <div className="h-1 w-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-400 animate-[loading_2s_linear_infinite]" style={{ width: '60%' }} />
          </div>
          <div className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-tighter">Engine Core Stability: 98.4%</div>
        </div>

        {/* Right Console */}
        <div className="absolute bottom-0 right-0 w-1/4 h-1/3 bg-gradient-to-tl from-slate-950 to-slate-900/80 border-t border-l border-white/10 rounded-tl-[100px] p-8 flex flex-col justify-end items-end gap-4 shadow-2xl">
           <div className="text-right">
             <div className="text-[10px] font-mono text-cyan-500/50 uppercase mb-1 tracking-widest">Life Support</div>
             <div className="flex gap-1 justify-end">
                <div className="w-1 h-6 bg-cyan-500" />
                <div className="w-1 h-6 bg-cyan-500" />
                <div className="w-1 h-6 bg-cyan-500" />
                <div className="w-1 h-6 bg-cyan-600/30" />
             </div>
           </div>
           <div className="w-full h-12 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center">
              <span className="text-cyan-400 font-mono text-xs animate-pulse tracking-[0.3em]">SCANNING...</span>
           </div>
        </div>

        {/* HUD Elements - Center Glass */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-1/2 flex items-center justify-center">
           {/* Center Reticle */}
           <div className="relative w-32 h-32 border border-cyan-500/20 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full" />
              <div className="absolute top-0 w-px h-4 bg-cyan-400" />
              <div className="absolute bottom-0 w-px h-4 bg-cyan-400" />
              <div className="absolute left-0 w-4 h-px bg-cyan-400" />
              <div className="absolute right-0 w-4 h-px bg-cyan-400" />
           </div>
           
           {/* Speed Indicators during Hyperdrive */}
           {isHyperdrive && (
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" />
                <div className="absolute text-cyan-400 font-black text-4xl italic tracking-tighter opacity-50 animate-bounce">WARP ACTIVE</div>
             </div>
           )}
        </div>

        {/* Top Trim */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-slate-950/90 rounded-b-3xl border-b border-white/10 flex items-center justify-center gap-12 px-12">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[8px] font-black tracking-widest text-red-500 uppercase">REC</span>
           </div>
           <div className="text-[10px] font-mono text-white/40 tracking-[0.5em]">SYSTEM AUTO-PILOT ENABLED</div>
           <div className="text-[10px] font-mono text-cyan-400 tracking-widest">NAV: 04-X-99</div>
        </div>
      </div>
    </div>
  );
};

export default Cockpit3D;

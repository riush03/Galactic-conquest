
import React from 'react';

interface AstronautInteractionProps {
  position: { x: number; y: number };
  onTakePhoto: () => void;
  onDeployFlag: () => void;
  onClose: () => void;
}

const AstronautInteraction: React.FC<AstronautInteractionProps> = ({ position, onTakePhoto, onDeployFlag, onClose }) => {
  return (
    <div 
      className="fixed z-[250] pointer-events-auto animate-[whoa_0.2s_ease-out]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="relative -translate-x-1/2 -translate-y-full mb-8">
        <div className="bg-slate-950/90 backdrop-blur-3xl border-2 border-cyan-400/40 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.3)] w-64">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 border-b border-white/10 pb-2">
            Unit: Explorer-01
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onTakePhoto(); }}
              className="flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                <i className="fas fa-camera" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black uppercase text-white">Take Photo</div>
                <div className="text-[9px] text-white/40 uppercase">Sync to Log</div>
              </div>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onDeployFlag(); }}
              className="flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <i className="fas fa-flag" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black uppercase text-white">Deploy Flag</div>
                <div className="text-[9px] text-white/40 uppercase">Mark Sector</div>
              </div>
            </button>
          </div>

          {/* Close Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 border border-white/20 rounded-full flex items-center justify-center text-xs hover:bg-white/10 transition-all"
          >
            <i className="fas fa-times" />
          </button>

          {/* Pointing Triangle */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-cyan-400/40" />
        </div>
      </div>
    </div>
  );
};

export default AstronautInteraction;

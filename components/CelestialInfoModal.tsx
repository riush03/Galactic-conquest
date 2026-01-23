
import React from 'react';
import { PlanetData } from '../types';

interface CelestialInfoModalProps {
  planet: PlanetData;
  onClose: () => void;
}

const CelestialInfoModal: React.FC<CelestialInfoModalProps> = ({ planet, onClose }) => {
  return (
    <div className="w-full max-h-full bg-slate-950/30 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-[slideRight_0.5s_ease-out] flex flex-col group/modal">
      {/* Visual Identity Strip */}
      <div className="h-1.5 w-full flex-shrink-0 flex">
         <div className="h-full flex-1" style={{ backgroundColor: planet.baseColor }} />
         <div className="h-full flex-1 opacity-50" style={{ backgroundColor: planet.atmosphereColor }} />
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="w-full h-1 bg-cyan-400 animate-[scan_6s_linear_infinite]" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-10 flex flex-col gap-8 scrollbar-thin">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] flex items-center gap-2">
              <i className="fas fa-microchip animate-pulse" /> Planetary Analysis
            </div>
            <span className="text-xs font-mono text-white/30 uppercase tracking-[0.2em]">Spectral Class: {planet.type}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/20 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="relative">
           <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-transparent opacity-30" />
           <p className="text-lg text-white/90 leading-relaxed italic font-medium tracking-tight">
             "{planet.description}"
           </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Anomalies List */}
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md transition-all group-hover/modal:bg-white/[0.08]">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 block opacity-60">Scanning Anomalies</span>
            <div className="grid grid-cols-1 gap-3">
              {planet.anomalies.map((a, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_#22d3ee] flex-shrink-0" /> 
                  <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">{a}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resources / Stats */}
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md transition-all group-hover/modal:bg-white/[0.08]">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-400 mb-5 block opacity-60">Elemental Composition</span>
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-white/40 uppercase tracking-tighter">Mineral Density</span>
                  <span className="text-cyan-400 font-black">{planet.resources.minerals * 10}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 shadow-[0_0_15px_#22d3ee]" style={{ width: `${planet.resources.minerals * 10}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-white/40 uppercase tracking-tighter">Energy Radiance</span>
                  <span className="text-yellow-400 font-black">{planet.resources.energy * 10}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 shadow-[0_0_15px_#facc15]" style={{ width: `${planet.resources.energy * 10}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex items-center justify-between flex-shrink-0">
           <div className="text-[8px] font-mono text-white/20 tracking-widest uppercase">
             Archives_Linked: SYS_V2
           </div>
           {planet.name === "The Sun" && (
              <div className="flex items-center gap-2">
                <i className="fas fa-exclamation-triangle text-orange-500 text-[10px] animate-pulse" />
                <div className="text-[9px] text-orange-500 font-black uppercase tracking-widest">
                  Critical Radiance Level
                </div>
              </div>
           )}
        </div>
      </div>
      <style>{`
        @keyframes slideRight {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CelestialInfoModal;

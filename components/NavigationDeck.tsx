
import React from 'react';
import { LevelDef } from '../types.ts';

interface NavigationDeckProps {
  levels: LevelDef[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const NavigationDeck: React.FC<NavigationDeckProps> = ({ levels, currentIndex, onSelect }) => {
  return (
    <div className="flex flex-col h-full w-full max-w-sm bg-slate-950/40 backdrop-blur-xl border-r border-white/10 p-6 animate-[slideIn_0.5s_ease-out] pointer-events-auto shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Universal Nav-Link</span>
        </div>
        <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Solar Index</h2>
        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1 italic">Select Coordinates to Engage Warp</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scroll scrollbar-thin pb-12">
        {levels.map((lvl, idx) => {
          const isCurrent = idx === currentIndex;
          const p = lvl.planet;

          return (
            <div 
              key={`${p.name}-${idx}`}
              onClick={() => !isCurrent && onSelect(idx)}
              className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer
                ${isCurrent 
                  ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.1)] cursor-default' 
                  : 'bg-white/5 border-transparent hover:border-cyan-400/40 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]'}
              `}
            >
              <div className="flex items-center gap-5">
                {/* Holographic Icon */}
                <div className="relative w-14 h-14 flex-shrink-0">
                  <div 
                    className={`absolute inset-0 rounded-full shadow-inner transition-transform duration-500 group-hover:scale-110
                      ${isCurrent ? 'animate-pulse' : ''}
                    `}
                    style={{ background: `radial-gradient(circle at 30% 30%, ${p.baseColor}, #000)` }}
                  >
                    <div className="absolute inset-0 opacity-40 mix-blend-screen rounded-full" 
                         style={{ background: `radial-gradient(circle at center, ${p.atmosphereColor} 0%, transparent 70%)` }} />
                  </div>
                  {!isCurrent && (
                    <div className="absolute -inset-1 border border-cyan-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-spin-slow" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-lg font-black uppercase tracking-tight truncate transition-colors ${isCurrent ? 'text-cyan-400' : 'text-white group-hover:text-cyan-200'}`}>
                      {p.name}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-cyan-400/60 uppercase tracking-tighter">{p.type}</span>
                      <span className={`text-[7px] font-black uppercase tracking-widest ${isCurrent ? 'text-cyan-400' : 'text-white/20 group-hover:text-cyan-400/80'}`}>
                        {isCurrent ? 'ACTIVE' : 'READY TO ENGAGE'}
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${isCurrent ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-white/20 group-hover:bg-cyan-400/40'}`} 
                        style={{ width: isCurrent ? '100%' : '15%' }} 
                      />
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                    <i className="fas fa-chevron-right text-cyan-400 text-sm" />
                  </div>
                )}
              </div>

              {/* Selection Glint Effect */}
              {!isCurrent && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-8 border-t border-white/5 text-center bg-slate-950/20">
        <div className="flex justify-center gap-1.5 mb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-cyan-400/20 rounded-full" />
          ))}
        </div>
        <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.5em] mb-1">Deep Space Protocol V.4</div>
        <div className="text-[10px] font-black text-cyan-500 italic tracking-[0.1em]">ENCRYPTION STABLE</div>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 10px; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
      `}</style>
    </div>
  );
};

export default NavigationDeck;


import React, { useState } from 'react';
import { PlanetData, LevelDef } from '../types.ts';

interface PlanetExplorerProps {
  levels: LevelDef[];
  currentLevelIndex: number;
  maxUnlockedLevel: number;
  onSelect: (index: number) => void;
  onClose: () => void;
  onDiscoverNew: () => Promise<void>;
  isDiscovering: boolean;
}

const PlanetExplorer: React.FC<PlanetExplorerProps> = ({ 
  levels, 
  currentLevelIndex, 
  maxUnlockedLevel, 
  onSelect, 
  onClose,
  onDiscoverNew,
  isDiscovering
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Terrestrial': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'Gas Giant': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'Ice Giant': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'Lava': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'Toxic': return 'text-lime-400 border-lime-500/30 bg-lime-500/10';
      case 'Cyber': return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
      case 'Crystal': return 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-[80px] animate-[whoa_0.4s_ease-out] flex items-center justify-center p-20 overflow-hidden">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-7xl h-full flex flex-col relative">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_15px_#22d3ee]" />
              <div className="text-cyan-400 font-black uppercase tracking-[0.8em] text-[10px] opacity-80">Navigational Uplink: Operational</div>
            </div>
            <h2 className="text-8xl font-black italic tracking-tighter uppercase text-white leading-none">Sector Map</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-cyan-400/50 transition-all text-3xl group mb-2"
          >
            <i className="fas fa-times group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Scrollable Planet List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-12 flex flex-col gap-6 pb-20 custom-scroll">
          {levels.map((lvl, idx) => {
            const isLocked = idx > maxUnlockedLevel;
            const isCurrent = idx === currentLevelIndex;
            const p = lvl.planet;
            const isHovered = hoveredIndex === idx;

            return (
              <div 
                key={`${p.name}-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`relative group flex items-center p-8 rounded-[4rem] border-2 transition-all duration-500 overflow-hidden
                  ${isLocked ? 'opacity-30 border-transparent grayscale scale-[0.98]' : 'border-white/5 hover:border-cyan-500/30 hover:bg-white/5'}
                  ${isCurrent ? 'bg-cyan-500/5 border-cyan-500/40 shadow-[0_0_80px_rgba(6,182,212,0.1)]' : ''}
                `}
              >
                {/* Scanning Effect Overlay */}
                {isHovered && !isLocked && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                    <div className="w-full h-1 bg-cyan-400 animate-[scan_2s_linear_infinite]" />
                  </div>
                )}

                {/* Planet Visual Sphere */}
                <div className="relative shrink-0 group">
                  <div 
                    className={`w-40 h-40 rounded-full relative shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-700
                      ${isHovered && !isLocked ? 'scale-110 rotate-12' : 'scale-100'}
                    `}
                    style={{ background: `radial-gradient(circle at 30% 30%, ${p.baseColor}, #000)` }}
                  >
                    {/* Atmosphere Halo */}
                    <div className="absolute inset-0 opacity-40 mix-blend-screen" 
                         style={{ background: `radial-gradient(circle at center, ${p.atmosphereColor} 0%, transparent 70%)` }} />
                    
                    {/* Planet Rings Overlay */}
                    {p.hasRings && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[20%] border-4 rounded-full opacity-30 skew-x-[60deg]"
                           style={{ borderColor: p.ringColor || '#fff', transform: 'translate(-50%, -50%) rotate(25deg)' }} />
                    )}
                  </div>
                  {isCurrent && (
                    <div className="absolute -inset-4 border-2 border-cyan-400/30 rounded-full animate-[ping_3s_linear_infinite]" />
                  )}
                </div>

                {/* Planet Info Details */}
                <div className="flex-1 ml-16">
                  <div className="flex items-center gap-6 mb-3">
                    <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                      {isLocked ? `Classified Sector ${lvl.index}` : p.name}
                    </h3>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
                      ${isLocked ? 'text-white/20 border-white/5' : getTypeColor(p.type)}
                    `}>
                      {p.type}
                    </span>
                  </div>
                  
                  <p className="text-lg text-white/50 italic mb-8 max-w-2xl line-clamp-1 font-medium">
                    {isLocked ? 'Encryption protocols active. Planetary data remains restricted.' : p.description}
                  </p>

                  <div className="flex gap-12 items-center">
                    <div className="flex gap-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Minerals</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-3 h-1.5 rounded-sm ${i < (p.resources.minerals/2) ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-white/5'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Energy</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-3 h-1.5 rounded-sm ${i < (p.resources.energy/2) ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-white/5'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Tech Potential</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-3 h-1.5 rounded-sm ${i < (p.resources.tech/2) ? 'bg-purple-400 shadow-[0_0_10px_rgba(192,38,211,0.5)]' : 'bg-white/5'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status / Jump Controls */}
                <div className="pr-8">
                  {isLocked ? (
                    <div className="flex items-center gap-4 text-white/20">
                      <i className="fas fa-lock text-3xl" />
                      <span className="text-xs font-black uppercase tracking-widest">Locked</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex flex-col items-end">
                      <div className="px-10 py-4 bg-cyan-400/10 rounded-full font-black text-[11px] uppercase tracking-[0.5em] text-cyan-400 border border-cyan-400/30">
                        Active Orbit
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onSelect(idx)}
                      className="group relative px-14 py-8 bg-cyan-600 hover:bg-cyan-500 rounded-full font-black text-xs uppercase tracking-[0.6em] transition-all shadow-xl hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] border-2 border-cyan-400/30 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      Initiate Jump
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Discover New Sector Button */}
          <div className="mt-8 flex justify-center pb-12">
            <button 
              onClick={onDiscoverNew}
              disabled={isDiscovering}
              className={`flex items-center gap-6 px-16 py-10 rounded-full border-2 border-dashed transition-all
                ${isDiscovering ? 'opacity-50 cursor-not-allowed border-white/10' : 'border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/5'}
              `}
            >
              {isDiscovering ? (
                <>
                  <i className="fas fa-circle-notch animate-spin text-2xl text-cyan-400" />
                  <span className="text-sm font-black uppercase tracking-[0.5em] text-cyan-400">Scanning Deep Space...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-satellite-dish text-2xl text-cyan-400 animate-bounce" />
                  <span className="text-sm font-black uppercase tracking-[0.5em] text-white/80">Discover New Sector</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanetExplorer;

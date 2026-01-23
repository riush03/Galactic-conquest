import React, { useState } from 'react';
import { BuildingType } from '../types.ts';

interface AstronautPanelProps {
  onSelect: (type: BuildingType) => void;
  onClose: () => void;
  buildingsInfo: Record<BuildingType, { name: string; cost: number; icon: string; desc: string; stats: string; color: string; biome: string }>;
}

const AstronautPanel: React.FC<AstronautPanelProps> = ({ onSelect, onClose, buildingsInfo }) => {
  const types: BuildingType[] = ['extractor', 'solar', 'lab', 'habitat', 'satellite', 'rover', 'drone', 'flag', 'shuttle', 'plants'];
  const [hovered, setHovered] = useState<BuildingType | null>(null);

  return (
    <div className="fixed inset-y-0 right-0 z-[200] flex items-center pr-8 pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto animate-[slideIn_0.4s_ease-out]">
        
        {/* Holographic Tooltips */}
        <div className="w-64 h-[400px] flex flex-col justify-center gap-3">
          {hovered && (
            <div className="p-6 bg-cyan-500/10 backdrop-blur-2xl border border-cyan-400/20 rounded-[2rem] animate-[whoa_0.2s_ease-out]">
              <div className="flex justify-between items-start mb-3">
                <h3 className={`text-xl font-black italic uppercase ${buildingsInfo[hovered].color}`}>{buildingsInfo[hovered].name}</h3>
                <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {buildingsInfo[hovered].cost}
                </span>
              </div>
              <p className="text-[10px] text-white/60 leading-tight mb-4 italic">"{buildingsInfo[hovered].desc}"</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-cyan-300">
                  <span>EFFICIENCY</span>
                  <span>{buildingsInfo[hovered].stats}</span>
                </div>
                <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: '70%' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Device Frame (Smaller Scale) */}
        <div className="relative w-[280px] h-[540px] bg-slate-950 border-[8px] border-slate-800 rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 pb-3 flex justify-between items-center border-b border-white/5">
            <div>
              <div className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.2em]">ASTRO-OS v4</div>
              <div className="text-base font-black italic text-white">21:03</div>
            </div>
            <div className="flex gap-1.5 text-cyan-400/40 text-[10px]">
              <i className="fas fa-signal" />
              <i className="fas fa-battery-three-quarters" />
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto scrollbar-thin">
            <h2 className="px-2 mb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Module Hub</h2>
            
            <div className="grid grid-cols-3 gap-4">
              {types.map((type) => (
                <button
                  key={type}
                  onMouseEnter={() => setHovered(type)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect(type)}
                  className={`group relative flex flex-col items-center gap-1.5 p-1.5 rounded-[1.5rem] transition-all duration-300
                    ${hovered === type ? 'bg-cyan-500/10 scale-105' : 'hover:bg-white/5'}
                  `}
                >
                  <div 
                    className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 relative
                      ${hovered === type ? 'shadow-lg' : ''}
                    `}
                    style={{
                      background: hovered === type ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '35% 65% 55% 45% / 45% 45% 55% 55%'
                    }}
                  >
                    <i className={`fas ${buildingsInfo[type].icon} text-xl transition-all ${hovered === type ? 'text-white' : 'text-cyan-400/50'}`} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-tighter text-center truncate w-full ${hovered === type ? 'text-cyan-400' : 'text-white/30'}`}>
                    {buildingsInfo[type].name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-center gap-8">
            <div className="flex items-center gap-1.5 opacity-30">
              <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[7px] font-black">B</div>
              <span className="text-[8px] font-black uppercase tracking-widest">BACK</span>
            </div>
            <button 
              onClick={onClose}
              className="flex items-center gap-1.5 group"
            >
              <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-[7px] font-black group-hover:scale-110 transition-transform">A</div>
              <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400">EXIT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstronautPanel;

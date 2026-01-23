
import React from 'react';
import { BuildingType } from '../types.ts';

interface SelectionWheelProps {
  onSelect: (type: BuildingType) => void;
  onClose: () => void;
  buildingsInfo: Record<BuildingType, { name: string; cost: number; icon: string; desc: string; stats: string; color: string; biome: string }>;
}

const SelectionWheel: React.FC<SelectionWheelProps> = ({ onSelect, onClose, buildingsInfo }) => {
  const types: BuildingType[] = ['extractor', 'solar', 'lab', 'habitat', 'satellite', 'rover', 'drone', 'flag'];
  const [hovered, setHovered] = React.useState<BuildingType | null>(null);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-[whoa_0.3s_ease-out]">
      <div className="relative w-[600px] h-[600px] flex items-center justify-center">
        
        {/* Central Specialist Hub */}
        <div className="relative w-48 h-48 rounded-full border-4 border-cyan-500/30 bg-slate-900/80 shadow-[0_0_80px_rgba(6,182,212,0.3)] flex items-center justify-center overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2)_0%,transparent_70%)] animate-pulse" />
          <i className="fas fa-user-astronaut text-6xl text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
          <div className="absolute bottom-4 text-[10px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">
            Ready to Deploy
          </div>
          {/* Scanning lines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="w-full h-1 bg-cyan-400 animate-[scan_2s_linear_infinite]" />
          </div>
        </div>

        {/* Radial Slots */}
        {types.map((type, i) => {
          const angle = (i / types.length) * (Math.PI * 2) - Math.PI / 2;
          const radius = 220;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const info = buildingsInfo[type];

          return (
            <div
              key={type}
              className="absolute transition-all duration-300 group"
              style={{ transform: `translate(${x}px, ${y}px)` }}
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(type)}
            >
              {/* Tooltip - appears above hovered item */}
              {hovered === type && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-56 p-4 bg-slate-900/90 border-2 border-cyan-500/50 rounded-2xl shadow-2xl animate-[slideIn_0.2s_ease-out] pointer-events-none z-50">
                  <div className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">{info.name}</div>
                  <div className="text-[10px] text-white/60 mb-2 italic">Cost: {info.cost}M</div>
                  <div className="px-2 py-1 bg-cyan-500/20 rounded-md text-[9px] font-bold text-cyan-300 inline-block">
                    {info.stats}
                  </div>
                </div>
              )}

              {/* The "Blob" Container */}
              <div 
                className={`w-24 h-24 flex items-center justify-center cursor-pointer transition-all duration-500
                  ${hovered === type ? 'scale-125 shadow-[0_0_40px_rgba(6,182,212,0.5)]' : 'opacity-80 scale-100'}
                `}
                style={{
                  borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                  background: hovered === type ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: hovered === type ? '3px solid rgba(34, 211, 238, 0.8)' : '2px solid rgba(255, 255, 255, 0.1)',
                  animation: hovered === type ? 'blobber 4s ease-in-out infinite' : 'none'
                }}
              >
                <i className={`fas ${info.icon} text-3xl transition-colors ${hovered === type ? 'text-white' : 'text-cyan-400/70'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Console Buttons Prompt */}
      <div className="fixed bottom-12 right-12 flex gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center font-black text-white shadow-lg">B</div>
          <span className="text-xs font-black uppercase tracking-widest text-white/50">Cancel</span>
        </div>
        <button 
          onClick={onClose}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-110 transition-transform">A</div>
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Exit Mode</span>
        </button>
      </div>

      <style>{`
        @keyframes blobber {
          0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          33% { border-radius: 60% 40% 30% 70% / 50% 30% 70% 60%; }
          66% { border-radius: 30% 70% 40% 60% / 60% 50% 30% 40%; }
        }
      `}</style>
    </div>
  );
};

export default SelectionWheel;

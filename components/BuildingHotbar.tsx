
import React, { useState } from 'react';
import { BuildingType, BuildingCategory } from '../types.ts';

interface BuildingHotbarProps {
  onSelect: (type: BuildingType | null) => void;
  selected: BuildingType | null;
  registry: Record<BuildingType, { name: string; cost: number; icon: string; cat: BuildingCategory }>;
  minerals: number;
}

const BuildingHotbar: React.FC<BuildingHotbarProps> = ({ onSelect, selected, registry, minerals }) => {
  const [activeCat, setActiveCat] = useState<BuildingCategory>('colony');
  const items = (Object.keys(registry) as BuildingType[]).filter(k => registry[k].cat === activeCat);

  return (
    <div className="flex flex-col items-center gap-4 animate-[slideInBottom_0.4s_ease-out] pointer-events-auto">
      
      {/* Category Toggles */}
      <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-full backdrop-blur-xl">
        {(['colony', 'station', 'science'] as BuildingCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCat(cat); onSelect(null); }}
            className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all
              ${activeCat === cat ? 'bg-cyan-500 text-white' : 'text-white/40 hover:text-white'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item Dock */}
      <div className="bg-slate-950/80 border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
        {items.map(type => {
          const info = registry[type];
          const isAffordable = minerals >= info.cost;
          const isActive = selected === type;

          return (
            <button
              key={type}
              onClick={() => onSelect(isActive ? null : type)}
              disabled={!isAffordable}
              className={`relative group flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                ${isActive ? 'bg-cyan-500 scale-110' : 'bg-white/5 hover:bg-white/10'}
                ${!isAffordable ? 'opacity-30 grayscale cursor-not-allowed' : ''}
              `}
            >
              <i className={`fas ${info.icon} text-lg ${isActive ? 'text-white' : 'text-cyan-400'}`} />
              <div className="text-[6px] font-black uppercase tracking-tighter opacity-60">
                {info.cost}M
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1 bg-slate-900 border border-white/20 rounded-lg text-[8px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {info.name}
              </div>
            </button>
          );
        })}

        {selected && (
          <button 
            onClick={() => onSelect(null)}
            className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
          >
            <i className="fas fa-times text-xs" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BuildingHotbar;

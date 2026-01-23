
import React from 'react';
import { BuildingType, BuildingCategory } from '../types.ts';

interface BuildingDetailsModalProps {
  type: BuildingType;
  info: { name: string; cost: number; icon: string; cat: BuildingCategory; description: string; stats: string };
  minerals: number;
  previouslyCrafted: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const BuildingDetailsModal: React.FC<BuildingDetailsModalProps> = ({ 
  type, info, minerals, previouslyCrafted, onConfirm, onClose 
}) => {
  const isAffordable = minerals >= info.cost;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-8 animate-[whoa_0.3s_ease-out] pointer-events-auto">
      <div className="relative w-full max-w-4xl bg-[#f5efe1] border-[12px] border-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh]">
        
        {/* Left Side: Visual & Basic Info */}
        <div className="w-full md:w-1/2 bg-[#e8e2d4] p-12 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-[#d4cdc0]">
          <div className="absolute top-8 left-8 flex items-center gap-3">
             <div className="w-10 h-10 bg-[#7d7465] rounded-xl flex items-center justify-center text-white text-xl">
               <i className={`fas ${info.icon}`} />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-[#5c5447] tracking-tight">{info.name}</h2>
                <div className="flex gap-4 text-[10px] font-bold text-[#8c8273] uppercase tracking-widest">
                   <span>1.0 x 1.0</span>
                   <span>Storage: 0</span>
                </div>
             </div>
          </div>

          <div className="w-80 h-80 mt-12 mb-8 relative flex items-center justify-center group">
            {/* The Building Icon/Preview - Enlarged and Floating */}
            <div className="relative z-10 p-16 bg-white/40 rounded-[4rem] shadow-inner group-hover:scale-105 transition-transform duration-500 animate-[float_3s_ease-in-out_infinite]">
              <i className={`fas ${info.icon} text-[10rem] text-[#5c5447] drop-shadow-2xl`} />
            </div>
            {/* Dynamic shadow underneath */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/10 rounded-[100%] blur-2xl animate-[shadow_3s_ease-in-out_infinite]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#5c5447]/60 italic">Previously Crafted</span>
            {previouslyCrafted ? (
              <i className="fas fa-check-circle text-emerald-500 text-xl" />
            ) : (
              <i className="far fa-circle text-[#5c5447]/20 text-xl" />
            )}
          </div>
        </div>

        {/* Right Side: Materials & Craft Button */}
        <div className="w-full md:w-1/2 p-12 flex flex-col">
          <h3 className="text-xl font-bold text-[#5c5447] mb-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#5c5447]" /> Materials (Have/Need)
          </h3>

          <div className="flex-1 space-y-4">
            {/* Minerals Material Item */}
            <div className="flex items-center gap-4 group">
              <div className="w-14 h-14 bg-[#d4cdc0] rounded-2xl flex items-center justify-center text-[#5c5447] text-2xl shadow-sm group-hover:bg-[#c4bdad] transition-colors">
                <i className="fas fa-gem" />
              </div>
              <div className="flex-1 border-b-2 border-dotted border-[#d4cdc0] pb-2">
                <span className="text-lg font-bold text-[#5c5447] lowercase tracking-tight">raw minerals</span>
              </div>
              <div className={`px-4 py-2 rounded-2xl font-bold text-lg min-w-[80px] text-center
                ${isAffordable ? 'bg-[#d4cdc0] text-[#5c5447]' : 'bg-red-100 text-red-500'}
              `}>
                <span className={minerals < info.cost ? 'text-red-500' : 'text-[#8c8273]'}>{minerals}</span>
                <span className="mx-1 text-[#8c8273]/40">/</span>
                <span className="text-[#5c5447]">{info.cost}</span>
              </div>
            </div>

            {/* Description & Stats section */}
            <div className="mt-12 p-6 bg-[#e8e2d4]/50 rounded-[2rem] border border-white/50">
               <p className="text-sm italic text-[#5c5447]/80 leading-relaxed mb-4">"{info.description}"</p>
               <div className="text-[10px] font-black uppercase tracking-widest text-[#8c8273] flex items-center gap-2">
                  <i className="fas fa-chart-simple" /> Output: {info.stats}
               </div>
            </div>
          </div>

          {/* Crafting Button UI */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <button 
              disabled={!isAffordable}
              onClick={onConfirm}
              className={`relative group w-full py-6 rounded-full font-black text-xl uppercase tracking-widest transition-all shadow-xl
                ${isAffordable 
                  ? 'bg-[#eec643] hover:bg-[#f1d06b] text-[#5c5447] shadow-[#eec643]/20 active:scale-95' 
                  : 'bg-[#d4cdc0] text-[#8c8273] cursor-not-allowed'}
              `}
            >
              {isAffordable ? 'Initiate Deployment' : 'Insufficient Resources!'}
              {isAffordable && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <i className="fas fa-arrow-right animate-bounce-x" />
                </div>
              )}
            </button>

            <div className="flex gap-8">
               <button onClick={onClose} className="flex items-center gap-2 group">
                 <div className="w-8 h-8 rounded-full bg-[#5c5447] text-white flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform">B</div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#5c5447]">Back</span>
               </button>
               <div className="flex items-center gap-2 opacity-30">
                 <div className="w-8 h-8 rounded-full bg-[#5c5447] text-white flex items-center justify-center text-xs font-bold">X</div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#5c5447]">Favorite</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-x {
          0%, 100% { transform: translate(-25%, -50%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: translate(0, -50%); animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes shadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.1; }
          50% { transform: translateX(-50%) scale(0.8); opacity: 0.05; }
        }
        .animate-bounce-x { animation: bounce-x 1s infinite; }
      `}</style>
    </div>
  );
};

export default BuildingDetailsModal;

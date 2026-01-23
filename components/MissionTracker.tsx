import React from 'react';
import { Mission, Building } from '../types.ts';

interface MissionTrackerProps {
  missions: Mission[];
  buildings: Building[];
}

const MissionTracker: React.FC<MissionTrackerProps> = ({ missions, buildings }) => {
  return (
    <div className="fixed top-4 left-4 z-[60] flex flex-col gap-2 animate-[slideInLeft_0.5s_ease-out]">
      <div className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-0.5 opacity-40 ml-2">
        Missions
      </div>
      
      {missions.map((mission) => {
        const currentCount = mission.buildingType 
          ? buildings.filter(b => b.type === mission.buildingType).length
          : buildings.length;
        
        const isComplete = currentCount >= mission.target;
        const progressPercent = Math.min((currentCount / mission.target) * 100, 100);

        return (
          <div 
            key={mission.id}
            className={`group relative w-52 p-3 rounded-[1rem] border transition-all duration-500
              ${isComplete 
                ? 'bg-emerald-500/5 border-emerald-400/20' 
                : 'bg-slate-950/60 border-white/5 hover:border-cyan-500/20'}
            `}
          >
            {/* Status Header */}
            <div className="flex justify-between items-center mb-1.5">
              <div className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border
                ${isComplete 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}
              `}>
                {isComplete ? 'DONE' : 'REQ'}
              </div>
              {isComplete && <i className="fas fa-check text-emerald-400 text-[8px]" />}
            </div>

            <h3 className={`text-xs font-black italic uppercase tracking-tighter mb-0.5
              ${isComplete ? 'text-emerald-400' : 'text-white'}
            `}>
              {mission.title}
            </h3>
            
            <p className="text-[8px] text-white/40 mb-2 leading-tight">
              {mission.description}
            </p>

            {/* Progress Visual */}
            <div className="space-y-1">
              <div className="flex justify-between text-[6px] font-bold uppercase">
                <span className="text-white/20">{mission.requirement}</span>
                <span className={isComplete ? 'text-emerald-400' : 'text-cyan-400'}>
                  {currentCount}/{mission.target}
                </span>
              </div>
              <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out
                    ${isComplete ? 'bg-emerald-400' : 'bg-cyan-400'}
                  `}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MissionTracker;

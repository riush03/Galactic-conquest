
import React from 'react';
import { Achievement } from '../types';

interface AchievementPanelProps {
  achievements: Achievement[];
  onClose: () => void;
}

const AchievementPanel: React.FC<AchievementPanelProps> = ({ achievements, onClose }) => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-8 animate-[whoa_0.4s_ease-out]">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <i className="fas fa-trophy text-yellow-500 text-2xl animate-bounce" />
              <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.4em]">Service Record</span>
            </div>
            <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">Achievements</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-2xl group"
          >
            <i className="fas fa-times group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-6 scrollbar-thin">
          {achievements.map((ach) => (
            <div 
              key={ach.id}
              className={`relative p-6 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden flex gap-5
                ${ach.unlocked 
                  ? 'bg-cyan-500/5 border-cyan-500/30' 
                  : 'bg-white/5 border-transparent opacity-50'}
              `}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0
                ${ach.unlocked ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-white/20'}
              `}>
                <i className={`fas ${ach.icon} text-2xl`} />
              </div>

              <div>
                <h3 className={`text-xl font-black italic uppercase tracking-tighter mb-1
                  ${ach.unlocked ? 'text-white' : 'text-white/30'}
                `}>
                  {ach.unlocked ? ach.title : 'Classified Milestone'}
                </h3>
                <p className={`text-xs italic leading-tight
                  ${ach.unlocked ? 'text-white/60' : 'text-white/10'}
                `}>
                  {ach.unlocked ? ach.description : 'Continue exploring to unlock this data.'}
                </p>
              </div>

              {ach.unlocked && (
                <div className="absolute top-4 right-4 text-cyan-400">
                  <i className="fas fa-circle-check text-xs" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        <div className="p-8 border-t border-white/5 bg-slate-950/50 flex justify-between items-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Total Completed: {achievements.filter(a => a.unlocked).length} / {achievements.length}
          </div>
          <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500" 
              style={{ width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementPanel;

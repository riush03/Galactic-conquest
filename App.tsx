
import React, { useState, useCallback, useEffect, useRef } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Cockpit3D from './components/Cockpit3D';
import { LEVELS } from './constants';
import { PlanetData, ColonyState, BuildingType, ViewMode, InventoryItem, Mission, Achievement, Building, FeedMessage, MenuState } from './types';
import { spaceAudio } from './services/audioService';

const MissionPanel: React.FC<{ missions: Mission[]; currentColony: ColonyState }> = ({ missions, currentColony }) => {
  return (
    <div className="fixed top-24 left-6 z-50 w-72 bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Active Objectives</h3>
      </div>
      <div className="space-y-4">
        {missions.map((m) => {
          // Calculate progress based on mission type
          let current = 0;
          if (m.type === 'build') {
            current = currentColony.buildings.filter(b => b.type === m.buildingType).length;
          } else if (m.type === 'resource_minerals') {
            current = currentColony.minerals;
          } else if (m.type === 'resource_energy') {
            current = currentColony.energy;
          } else if (m.type === 'resource_tech') {
            current = currentColony.tech;
          }

          const progress = Math.min(100, (current / m.target) * 100);
          const isDone = current >= m.target;

          return (
            <div key={m.id} className={`transition-opacity ${isDone ? 'opacity-40' : 'opacity-100'}`}>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1">{m.title}</span>
                <span className="text-[10px] font-mono text-cyan-400">{Math.floor(current)} / {m.target}</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isDone ? 'bg-green-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MissionCompleteOverlay: React.FC<{ planetName: string; onNext: () => void }> = ({ planetName, onNext }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
      <div className="max-w-xl w-full bg-slate-900 border-2 border-green-500 rounded-[50px] p-12 text-center shadow-[0_0_100px_rgba(34,197,94,0.3)] animate-[whoa_0.5s_ease-out]">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.6)]">
          <i className="fas fa-check text-4xl text-white" />
        </div>
        <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white mb-2">Planet Secured</h2>
        <p className="text-green-400 text-xs font-black uppercase tracking-[0.5em] mb-8">Mission objectives finalized on {planetName}</p>
        
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-10 text-left">
          <div className="text-[10px] font-black text-white/40 uppercase mb-4 tracking-widest">Colony Performance</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] text-white/30 uppercase font-black">Rating</div>
              <div className="text-xl font-black text-yellow-500 tracking-widest">RANK S</div>
            </div>
            <div>
              <div className="text-[9px] text-white/30 uppercase font-black">Bonus</div>
              <div className="text-xl font-black text-cyan-400">+2500 MIN</div>
            </div>
          </div>
        </div>

        <button 
          onClick={onNext}
          className="w-full py-6 bg-green-600 hover:bg-green-500 text-white font-black text-xl uppercase tracking-[0.4em] rounded-3xl transition-all shadow-2xl active:scale-95 border-b-8 border-green-800"
        >
          Next Sector Jump
        </button>
      </div>
    </div>
  );
};

const AstronautGreeting: React.FC<{ planetName: string; onClose: () => void }> = ({ planetName, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/20 pointer-events-none">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-3xl border-2 border-cyan-500 rounded-[40px] p-8 shadow-[0_0_80px_rgba(6,182,212,0.3)] animate-[whoa_0.4s_ease-out] pointer-events-auto">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-cyan-400">
             <i className="fas fa-user-astronaut text-slate-950 text-3xl" />
          </div>
          <div>
            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Colony Commander</div>
            <div className="text-2xl font-black italic uppercase tracking-tighter text-white">Commander Shepard</div>
          </div>
        </div>
        <p className="text-white/80 text-lg font-medium leading-relaxed italic mb-8">
          "Greetings, Pilot! We've successfully touched down on <span className="text-cyan-400 font-bold">{planetName}</span>. Atmosphere is stable and the resource scanners are already picking up high mineral signatures. Let's begin construction immediately!"
        </p>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl active:scale-95 border-b-4 border-cyan-800"
        >
          Begin Mission
        </button>
      </div>
    </div>
  );
};

const AchievementToast: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  return (
    <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[250] bg-slate-900 border-2 border-yellow-500 p-3 md:p-5 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-[slideIn_0.3s_ease-out] flex items-center gap-3 md:gap-5 pointer-events-none backdrop-blur-xl max-w-[90vw]">
      <div className="w-10 h-10 md:w-14 md:h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-400 flex-shrink-0">
        <i className={`fas ${achievement.icon} text-yellow-400 text-xl md:text-2xl`} />
      </div>
      <div>
        <div className="text-[8px] md:text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1 flex justify-between">
          <span>Achievement Unlocked</span>
          {achievement.rewardMinerals && <span className="text-white ml-2">+ {achievement.rewardMinerals} MIN</span>}
        </div>
        <div className="text-lg md:text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{achievement.title}</div>
        <div className="text-white/40 text-[8px] md:text-[10px] uppercase mt-1 line-clamp-1">{achievement.description}</div>
      </div>
    </div>
  );
};

const CelebrationOverlay: React.FC<{ moduleName: string; onComplete: () => void }> = ({ moduleName, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-[300] pointer-events-none flex flex-col items-center justify-center bg-cyan-500/10 backdrop-blur-sm animate-flash-out p-4">
      <div className="bg-white/10 p-8 md:p-12 rounded-[40px] md:rounded-[60px] border border-white/20 backdrop-blur-3xl flex flex-col items-center max-w-full">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-cyan-500 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_40px_rgba(6,182,212,0.8)] animate-pulse">
           <i className="fas fa-hammer text-2xl md:text-4xl text-white" />
        </div>
        <h2 className="text-4xl md:text-8xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-[whoa_0.4s_ease-out] text-center">
          {moduleName}
        </h2>
        <div className="bg-cyan-500 text-white font-black px-6 py-2 rounded-full text-[10px] md:text-xs uppercase tracking-[0.5em] mt-6 md:mt-8 shadow-2xl">Module Operational</div>
      </div>
    </div>
  );
};

const SplashOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <div className="absolute inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center cursor-pointer overflow-hidden group" onClick={onComplete}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-transparent to-transparent animate-pulse" />
      <h1 data-text="VOYAGE" className="glitch-text text-6xl md:text-[14rem] font-black italic tracking-tighter leading-none text-white mb-16 transition-transform group-hover:scale-105 duration-1000">VOYAGE</h1>
      <button className="px-12 py-5 md:px-16 md:py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl md:text-2xl uppercase tracking-[0.4em] rounded-2xl border-2 border-cyan-400 transition-all shadow-2xl group-active:scale-95">
        Initiate System
      </button>
      <div className="absolute bottom-10 text-cyan-500/30 text-[10px] font-mono tracking-widest uppercase">Initializing Colonial Link 5.1.0</div>
    </div>
  );
};

const GalaxyMap: React.FC<{ onSelect: (idx: number) => void; currentIdx: number; onClose: () => void }> = ({ onSelect, currentIdx, onClose }) => {
  return (
    <div className="absolute inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center p-4 md:p-16 overflow-y-auto scrollbar-thin">
      <div className="max-w-7xl w-full">
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
          <div className="text-left">
            <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase mb-2">Galaxy Chart</h2>
            <p className="text-cyan-400 text-[9px] md:text-[11px] font-black tracking-[0.5em] uppercase">Select destination for jump</p>
          </div>
          <button onClick={onClose} className="px-6 py-2 md:px-8 md:py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Dismiss</button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 md:gap-8">
          {LEVELS.map((level, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`group relative p-6 md:p-8 rounded-3xl border-2 transition-all text-left overflow-hidden h-[280px] md:h-[320px] flex flex-col justify-between
                ${idx === currentIdx ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'border-white/5 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'}
              `}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-cyan-400">{level.planet.name}</h3>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20 shadow-xl" style={{ backgroundColor: level.planet.baseColor }} />
                </div>
                <p className="text-white/40 text-[10px] md:text-[11px] uppercase font-medium leading-relaxed line-clamp-3 tracking-tight">{level.planet.description}</p>
              </div>
              <div className="relative z-10 grid grid-cols-3 gap-2 md:gap-4 border-t border-white/10 pt-4 md:pt-6">
                <div className="text-center">
                  <div className="text-[8px] md:text-[9px] text-white/30 font-black mb-1">MIN</div>
                  <div className="text-base md:text-xl font-mono font-bold text-yellow-500">{level.planet.resources.minerals}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] md:text-[9px] text-white/30 font-black mb-1">NRG</div>
                  <div className="text-base md:text-xl font-mono font-bold text-cyan-400">{level.planet.resources.energy}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] md:text-[9px] text-white/30 font-black mb-1">TCH</div>
                  <div className="text-base md:text-xl font-mono font-bold text-purple-400">{level.planet.resources.tech}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [menuState, setMenuState] = useState<MenuState>('splash');
  const [levelIndex, setLevelIndex] = useState(0); 
  const [showGalaxyMap, setShowGalaxyMap] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  
  const currentLevelDef = LEVELS[levelIndex];
  const [planet, setPlanet] = useState<PlanetData>(currentLevelDef.planet);
  const [hyperdrive, setHyperdrive] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [placingType, setPlacingType] = useState<BuildingType | null>(null);
  const [screenEffect, setScreenEffect] = useState<'none' | 'shake' | 'flash'>('none');
  const [celebration, setCelebration] = useState<string | null>(null);
  
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first_landing', title: 'Small Step', icon: 'fa-shoe-prints', description: 'Touch down on an alien world.', unlocked: false, rewardMinerals: 500 },
    { id: 'master_builder', title: 'Industrialist', icon: 'fa-industry', description: 'Deploy 5 structures on a planet.', unlocked: false, rewardMinerals: 1000 },
    { id: 'rover_commander', title: 'Scout Master', icon: 'fa-car-side', description: 'Deploy 3 automated rovers.', unlocked: false, rewardMinerals: 800 },
    { id: 'warp_speed', title: 'Faster Than Light', icon: 'fa-bolt', description: 'Engage Hyperdrive protocols.', unlocked: false, rewardMinerals: 300 },
  ]);
  const [unlockedToast, setUnlockedToast] = useState<Achievement | null>(null);

  const [colony, setColony] = useState<ColonyState>({
    isEstablished: false, minerals: 2000, energy: 1000, tech: 0, buildings: []
  });

  // Mission Tracking Logic
  useEffect(() => {
    if (menuState !== 'playing' || viewMode !== 'surface') return;
    
    const allDone = currentLevelDef.missions.every(m => {
      if (m.type === 'build') {
        return colony.buildings.filter(b => b.type === m.buildingType).length >= m.target;
      }
      if (m.type === 'resource_minerals') return colony.minerals >= m.target;
      if (m.type === 'resource_energy') return colony.energy >= m.target;
      if (m.type === 'resource_tech') return colony.tech >= m.target;
      return false;
    });

    if (allDone && !showMissionComplete) {
      setTimeout(() => {
        setShowMissionComplete(true);
        spaceAudio.playSuccess();
      }, 1000);
    }
  }, [colony, currentLevelDef, menuState, viewMode, showMissionComplete]);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id === id && !a.unlocked) {
        const updated = { ...a, unlocked: true };
        setUnlockedToast(updated);
        if (updated.rewardMinerals) {
          setColony(c => ({ ...c, minerals: c.minerals + updated.rewardMinerals! }));
        }
        spaceAudio.playSuccess();
        setTimeout(() => setUnlockedToast(null), 5000);
        return updated;
      }
      return a;
    }));
  }, []);

  const handleWarpToLevel = async (nextIdx: number) => {
    setShowGalaxyMap(false);
    setShowGreeting(false);
    setShowMissionComplete(false);
    if (menuState !== 'playing') setMenuState('playing');
    if (hyperdrive) return; 

    setHyperdrive(true); 
    setScreenEffect('flash'); 
    spaceAudio.playWarp();
    
    setTimeout(() => {
      const targetIdx = Math.min(nextIdx, LEVELS.length - 1);
      setLevelIndex(targetIdx);
      setPlanet(LEVELS[targetIdx].planet);
      // Reset planet-specific colony but carry minerals (like capital)
      setColony(prev => ({ 
        ...prev, 
        buildings: [], 
        minerals: prev.minerals + 2500, // Victory bonus
        energy: 1000,
        tech: 0
      }));
      setHyperdrive(false); 
      setScreenEffect('flash'); 
      unlockAchievement('warp_speed');
      setTimeout(() => setScreenEffect('none'), 500);
    }, 2500); 
  };

  const inventory: InventoryItem[] = [
    { type: 'extractor', name: 'Extractor', cost: 100, icon: 'fa-bore-hole', color: 'text-yellow-400' },
    { type: 'lab', name: 'Science Lab', cost: 250, icon: 'fa-microscope', color: 'text-purple-400' },
    { type: 'habitat', name: 'Colony Pod', cost: 150, icon: 'fa-house-user', color: 'text-blue-400' },
    { type: 'solar', name: 'Power Array', cost: 80, icon: 'fa-bolt', color: 'text-cyan-400' },
    { type: 'plants', name: 'Biodome', cost: 120, icon: 'fa-leaf', color: 'text-green-400' },
    { type: 'rover', name: 'Space Rover', cost: 300, icon: 'fa-car-side', color: 'text-orange-400' },
  ];

  useEffect(() => {
    if (menuState !== 'playing') return;
    const interval = setInterval(() => {
      setColony(prev => {
        let m = 5, e = 5, t = 2;
        prev.buildings.forEach(b => {
          if (b.type === 'extractor') m += 30;
          if (b.type === 'solar') e += 50;
          if (b.type === 'plants') e += 15;
          if (b.type === 'lab') t += 10;
        });
        return { 
          ...prev, 
          minerals: prev.minerals + m, 
          energy: prev.energy + e,
          tech: prev.tech + t
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [menuState]);

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black text-white select-none`}>
      {screenEffect === 'flash' && <div className="absolute inset-0 z-[150] bg-white animate-flash-out pointer-events-none" />}
      
      {menuState === 'splash' && <SplashOverlay onComplete={() => { spaceAudio.init(); setMenuState('playing'); setShowGalaxyMap(true); }} />}
      {showGalaxyMap && <GalaxyMap onSelect={handleWarpToLevel} currentIdx={levelIndex} onClose={() => setShowGalaxyMap(false)} />}

      <SimulationCanvas 
        planet={planet} hyperdrive={hyperdrive} viewOffset={viewOffset} buildings={colony.buildings} viewMode={viewMode}
        onPlanetClick={() => viewMode === 'orbit' && !hyperdrive && setViewMode('landing')}
        onPlaceBuilding={(pos) => {
          const selected = inventory.find(i => i.type === placingType);
          if (selected && colony.minerals >= selected.cost) {
            setColony(prev => {
              const newB = [...prev.buildings, { id: Math.random().toString(), type: placingType!, position: pos, timestamp: Date.now(), progress: 100 }];
              if (newB.length >= 5) unlockAchievement('master_builder');
              if (newB.filter(b => b.type === 'rover').length >= 3) unlockAchievement('rover_commander');
              return { ...prev, minerals: prev.minerals - selected.cost, buildings: newB };
            });
            setCelebration(selected.name); setPlacingType(null); spaceAudio.playLaser();
          }
        }}
        isPlacing={placingType} isStarted={menuState === 'playing'}
        onLandComplete={() => { setViewMode('surface'); unlockAchievement('first_landing'); setShowGreeting(true); spaceAudio.playSuccess(); }} 
        onAscendComplete={() => setViewMode('orbit')}
      />

      {(viewMode === 'orbit' || viewMode === 'ascending') && menuState === 'playing' && <Cockpit3D tilt={viewOffset} isHyperdrive={hyperdrive} />}

      {menuState === 'playing' && !showGalaxyMap && (
        <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 md:gap-12 bg-slate-950/80 backdrop-blur-2xl px-10 md:px-20 py-3 md:py-5 rounded-full border border-white/10 z-50 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[8px] md:text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-1">Minerals</span>
            <span className="text-xl md:text-3xl font-mono font-black">{Math.floor(colony.minerals)}</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] md:text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-1">Energy</span>
            <span className="text-xl md:text-3xl font-mono font-black">{Math.floor(colony.energy)}</span>
          </div>
          <div className="w-px h-8 md:h-10 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] md:text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Tech</span>
            <span className="text-xl md:text-3xl font-mono font-black">{Math.floor(colony.tech)}</span>
          </div>
        </div>
      )}

      {viewMode === 'surface' && menuState === 'playing' && !showGalaxyMap && !showMissionComplete && (
        <MissionPanel missions={currentLevelDef.missions} currentColony={colony} />
      )}

      {viewMode === 'surface' && menuState === 'playing' && !showGalaxyMap && (
        <div className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl px-2 md:px-4 flex flex-col items-center gap-4 md:gap-8">
          <div className={`px-8 md:px-12 py-2 md:py-3 rounded-full border border-cyan-400/50 bg-cyan-600/30 backdrop-blur-xl transition-all ${placingType ? 'scale-105 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : ''}`}>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.5em] text-white italic">
              {placingType ? `Targeting zone for ${placingType.toUpperCase()}` : "Select structure to deploy"}
            </span>
          </div>
          <div className="bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-3xl md:rounded-[40px] p-4 md:p-8 flex flex-col md:flex-row items-center justify-between w-full shadow-2xl gap-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-4 w-full md:w-auto">
              {inventory.map((item) => (
                <button 
                  key={item.type} 
                  onClick={() => { setPlacingType(placingType === item.type ? null : item.type); spaceAudio.playLaser(); }}
                  disabled={colony.minerals < item.cost}
                  className={`relative flex-shrink-0 w-full h-16 md:w-28 md:h-28 rounded-2xl md:rounded-3xl border-2 transition-all flex flex-col items-center justify-center
                    ${placingType === item.type ? 'bg-cyan-600/40 border-cyan-400 scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white/5 border-transparent hover:bg-white/10'}
                    ${colony.minerals < item.cost ? 'opacity-20 grayscale cursor-not-allowed' : ''}
                  `}
                >
                  <i className={`fas ${item.icon} text-xl md:text-4xl mb-1 md:mb-2 ${item.color}`} />
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-tighter text-center px-1 truncate w-full">{item.name}</span>
                  <div className="absolute -top-2 -right-1 md:-top-3 md:-right-3 bg-slate-900 px-2 md:px-3 py-0.5 md:py-1 rounded-lg md:rounded-xl text-[7px] md:text-[10px] font-mono border border-white/10 shadow-lg">{item.cost}</div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setViewMode('ascending'); setShowGreeting(false); spaceAudio.playWhoosh(); }} 
              className="w-full md:w-auto md:ml-8 bg-cyan-600 hover:bg-cyan-500 text-white px-8 md:px-16 py-4 md:py-10 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black uppercase tracking-[0.3em] border border-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Orbit Insertion
            </button>
          </div>
        </div>
      )}

      {viewMode === 'orbit' && menuState === 'playing' && !hyperdrive && !showGalaxyMap && (
        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-6 md:gap-10">
          <div className="animate-bounce">
            <div className="px-10 py-3 md:px-16 md:py-4 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-cyan-400 font-black uppercase text-[10px] md:text-sm tracking-widest italic shadow-xl">
              World Targeted: {planet.name}
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-10">
            <button 
              onClick={() => { setViewMode('landing'); spaceAudio.playWhoosh(); }} 
              className="px-12 py-6 md:px-24 md:py-10 rounded-2xl md:rounded-3xl font-black text-sm md:text-lg uppercase tracking-[0.3em] md:tracking-[0.5em] bg-cyan-600 border-2 border-cyan-400 hover:scale-110 transition-all shadow-[0_0_60px_rgba(6,182,212,0.5)]"
            >
              Land Ship
            </button>
            <button 
              onClick={() => { setShowGalaxyMap(true); spaceAudio.playLaser(); }} 
              className="px-8 py-6 md:px-16 md:py-10 bg-slate-900 border border-white/10 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black uppercase tracking-[0.4em] hover:bg-slate-800 transition-all shadow-xl"
            >
              Star Map
            </button>
          </div>
        </div>
      )}

      {showMissionComplete && <MissionCompleteOverlay planetName={planet.name} onNext={() => handleWarpToLevel(levelIndex + 1)} />}
      {showGreeting && <AstronautGreeting planetName={planet.name} onClose={() => setShowGreeting(false)} />}
      {unlockedToast && <AchievementToast achievement={unlockedToast} />}
      {celebration && <CelebrationOverlay moduleName={celebration} onComplete={() => setCelebration(null)} />}
    </div>
  );
};

export default App;

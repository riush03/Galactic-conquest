
import React, { useState, useCallback, useEffect, useRef } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Cockpit3D from './components/Cockpit3D';
import { LEVELS } from './constants';
import { PlanetData, ColonyState, BuildingType, ViewMode, InventoryItem, Mission, Achievement, Building, FeedMessage, MenuState } from './types';
import { generateScientificLog } from './services/geminiService';
import { spaceAudio } from './services/audioService';

const AchievementToast: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  return (
    <div className="fixed top-8 right-8 z-[250] bg-slate-900 border-2 border-cyan-500/40 p-5 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-[slideIn_0.3s_ease-out] flex items-center gap-5 pointer-events-none backdrop-blur-xl">
      <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-400">
        <i className={`fas ${achievement.icon} text-cyan-400 text-xl`} />
      </div>
      <div>
        <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Status: Unlocked</div>
        <div className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">{achievement.title}</div>
        <div className="text-white/40 text-[9px] uppercase mt-1">{achievement.description}</div>
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
    <div className="absolute inset-0 z-[300] pointer-events-none flex flex-col items-center justify-center bg-cyan-500/10 backdrop-blur-sm animate-flash-out">
      <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-[whoa_0.4s_ease-out]">
        {moduleName}
      </h2>
      <div className="bg-cyan-500 text-white font-black px-8 py-2 rounded-full text-xs uppercase tracking-[0.5em] mt-6 shadow-2xl">Constructed</div>
    </div>
  );
};

const SplashOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <div className="absolute inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center cursor-pointer overflow-hidden group" onClick={onComplete}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-transparent to-transparent animate-pulse" />
      <h1 data-text="VOYAGE" className="glitch-text text-8xl md:text-[14rem] font-black italic tracking-tighter leading-none text-white mb-16 transition-transform group-hover:scale-105 duration-1000">VOYAGE</h1>
      <button className="px-16 py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-2xl uppercase tracking-[0.4em] rounded-2xl border-2 border-cyan-400 transition-all shadow-2xl group-active:scale-95">
        Start Game
      </button>
      <div className="absolute bottom-10 text-cyan-500/30 text-[10px] font-mono tracking-widest uppercase">Initializing Colonial Link 4.0.1</div>
    </div>
  );
};

const GalaxyMap: React.FC<{ onSelect: (idx: number) => void; currentIdx: number; onClose: () => void }> = ({ onSelect, currentIdx, onClose }) => {
  return (
    <div className="absolute inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center p-8 md:p-16 overflow-y-auto scrollbar-thin">
      <div className="max-w-7xl w-full">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
          <div className="text-left">
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-2">Planetary Chart</h2>
            <p className="text-cyan-400 text-[11px] font-black tracking-[0.5em] uppercase">Target a world for colonization</p>
          </div>
          <button onClick={onClose} className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Dismiss</button>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {LEVELS.map((level, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`group relative p-8 rounded-3xl border-2 transition-all text-left overflow-hidden h-[300px] flex flex-col justify-between
                ${idx === currentIdx ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'border-white/5 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'}
              `}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-cyan-400">{level.planet.name}</h3>
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-xl" style={{ backgroundColor: level.planet.baseColor }} />
                </div>
                <p className="text-white/40 text-[10px] uppercase font-medium leading-relaxed line-clamp-3 tracking-tight">{level.planet.description}</p>
              </div>
              <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                <div className="text-center">
                  <div className="text-[8px] text-white/30 font-black mb-1">MIN</div>
                  <div className="text-lg font-mono font-bold text-yellow-500">{level.planet.resources.minerals}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-white/30 font-black mb-1">NRG</div>
                  <div className="text-lg font-mono font-bold text-cyan-400">{level.planet.resources.energy}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-white/30 font-black mb-1">TCH</div>
                  <div className="text-lg font-mono font-bold text-purple-400">{level.planet.resources.tech}</div>
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
  
  const currentLevelDef = LEVELS[levelIndex];
  const [planet, setPlanet] = useState<PlanetData>(currentLevelDef.planet);
  const [hyperdrive, setHyperdrive] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [placingType, setPlacingType] = useState<BuildingType | null>(null);
  const [screenEffect, setScreenEffect] = useState<'none' | 'shake' | 'flash'>('none');
  const [celebration, setCelebration] = useState<string | null>(null);
  
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first_landing', title: 'Small Step', icon: 'fa-shoe-prints', description: 'Touch down on an alien world.', unlocked: false },
    { id: 'master_builder', title: 'Industrialist', icon: 'fa-industry', description: 'Deploy 5 structures on a planet.', unlocked: false },
    { id: 'warp_speed', title: 'Faster Than Light', icon: 'fa-bolt', description: 'Engage Hyperdrive protocols.', unlocked: false },
  ]);
  const [unlockedToast, setUnlockedToast] = useState<Achievement | null>(null);

  const [colony, setColony] = useState<ColonyState>({
    isEstablished: false, minerals: 1500, energy: 800, tech: 0, buildings: []
  });

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id === id && !a.unlocked) {
        const updated = { ...a, unlocked: true };
        setUnlockedToast(updated);
        setTimeout(() => setUnlockedToast(null), 5000);
        return updated;
      }
      return a;
    }));
  }, []);

  const handleWarpToLevel = async (nextIdx: number) => {
    setShowGalaxyMap(false);
    if (menuState !== 'playing') setMenuState('playing');
    if (hyperdrive) return; 

    setHyperdrive(true); 
    setScreenEffect('flash'); 
    spaceAudio.playWarp();
    
    setTimeout(() => {
      setLevelIndex(nextIdx);
      setPlanet(LEVELS[nextIdx].planet);
      setColony(prev => ({ ...prev, buildings: [], minerals: 1500, energy: 800 }));
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
    { type: 'rover', name: 'Space Rover', cost: 200, icon: 'fa-car-side', color: 'text-orange-400' },
  ];

  useEffect(() => {
    if (menuState !== 'playing') return;
    const interval = setInterval(() => {
      setColony(prev => {
        let m = 5, e = 5;
        prev.buildings.forEach(b => {
          if (b.type === 'extractor') m += 25;
          if (b.type === 'solar') e += 40;
          if (b.type === 'plants') e += 10;
        });
        return { ...prev, minerals: prev.minerals + m, energy: prev.energy + e };
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
              return { ...prev, minerals: prev.minerals - selected.cost, buildings: newB };
            });
            setCelebration(selected.name); setPlacingType(null); spaceAudio.playSuccess();
          }
        }}
        isPlacing={placingType} isStarted={menuState === 'playing'}
        onLandComplete={() => { setViewMode('surface'); unlockAchievement('first_landing'); }} 
        onAscendComplete={() => setViewMode('orbit')}
      />

      {(viewMode === 'orbit' || viewMode === 'ascending') && menuState === 'playing' && <Cockpit3D tilt={viewOffset} isHyperdrive={hyperdrive} />}

      {menuState === 'playing' && !showGalaxyMap && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-12 bg-slate-950/80 backdrop-blur-2xl px-16 py-4 rounded-full border border-white/10 z-50 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest mb-1">Minerals</span>
            <span className="text-2xl font-mono font-black">{Math.floor(colony.minerals)}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-1">Energy</span>
            <span className="text-2xl font-mono font-black">{Math.floor(colony.energy)}</span>
          </div>
        </div>
      )}

      {viewMode === 'surface' && menuState === 'playing' && !showGalaxyMap && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl px-4 flex flex-col items-center gap-8">
          <div className={`px-12 py-3 rounded-full border border-cyan-400/50 bg-cyan-600/30 backdrop-blur-xl transition-all ${placingType ? 'scale-110 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : ''}`}>
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic">
              {placingType ? `Positioning ${placingType.toUpperCase()} module...` : "Select a structure to deploy"}
            </span>
          </div>
          <div className="bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 flex items-center justify-between w-full shadow-2xl overflow-hidden">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {inventory.map((item) => (
                <button 
                  key={item.type} 
                  onClick={() => { setPlacingType(placingType === item.type ? null : item.type); spaceAudio.playLaser(); }}
                  disabled={colony.minerals < item.cost}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-3xl border-2 transition-all flex flex-col items-center justify-center
                    ${placingType === item.type ? 'bg-cyan-600/40 border-cyan-400 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-transparent hover:bg-white/10'}
                    ${colony.minerals < item.cost ? 'opacity-20 grayscale cursor-not-allowed' : ''}
                  `}
                >
                  <i className={`fas ${item.icon} text-3xl mb-1 ${item.color}`} />
                  <span className="text-[8px] font-black uppercase tracking-tighter text-center px-1">{item.name}</span>
                  <div className="absolute -top-2 -right-2 bg-slate-900 px-2 py-1 rounded-lg text-[8px] font-mono border border-white/10">{item.cost}</div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setViewMode('ascending'); spaceAudio.playWhoosh(); }} 
              className="ml-8 bg-cyan-600 hover:bg-cyan-500 text-white px-12 py-8 rounded-3xl text-xs font-black uppercase tracking-[0.3em] border border-cyan-400 transition-all hover:scale-105 active:scale-95"
            >
              Orbit Insertion
            </button>
          </div>
        </div>
      )}

      {viewMode === 'orbit' && menuState === 'playing' && !hyperdrive && !showGalaxyMap && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-10">
          <div className="animate-bounce">
            <div className="px-12 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-cyan-400 font-black uppercase text-xs tracking-widest italic">
              World Targeted: {planet.name}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setViewMode('landing'); spaceAudio.playWhoosh(); }} 
              className="px-20 py-8 rounded-3xl font-black text-sm uppercase tracking-[0.5em] bg-cyan-600 border-2 border-cyan-400 hover:scale-105 transition-all shadow-[0_0_50px_rgba(6,182,212,0.4)]"
            >
              Initiate Landing
            </button>
            <button 
              onClick={() => { setShowGalaxyMap(true); spaceAudio.playLaser(); }} 
              className="px-12 py-8 bg-slate-900 border border-white/10 rounded-3xl text-xs font-black uppercase tracking-[0.4em] hover:bg-slate-800 transition-all"
            >
              Star Chart
            </button>
          </div>
        </div>
      )}

      {unlockedToast && <AchievementToast achievement={unlockedToast} />}
      {celebration && <CelebrationOverlay moduleName={celebration} onComplete={() => setCelebration(null)} />}
    </div>
  );
};

export default App;

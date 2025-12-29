
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Cockpit3D from './components/Cockpit3D';
import { DEFAULT_PLANET } from './constants';
// Fix: Added missing Building type import from types.ts
import { PlanetData, ColonyState, BuildingType, ViewMode, InventoryItem, Mission, Achievement, Building } from './types';
import { generatePlanetDestinations } from './services/geminiService';
import { spaceAudio } from './services/audioService';

const MissionHUD: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const activeMissions = missions.filter(m => !m.completed);
  if (activeMissions.length === 0) return null;

  return (
    <div className="absolute top-24 left-6 z-50 pointer-events-none">
      <div className="bg-slate-950/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl w-64 shadow-2xl">
        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Active Objectives</div>
        <div className="space-y-3">
          {activeMissions.map(m => (
            <div key={m.id} className="group">
              <div className="text-[11px] font-bold text-white/90 mb-1">{m.title}</div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-1000" 
                  style={{ width: `${(m.current / m.target) * 100}%` }} 
                />
              </div>
              <div className="flex justify-between mt-1 text-[8px] font-mono text-cyan-500/60 uppercase">
                <span>{m.requirement}</span>
                <span>{m.current} / {m.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AchievementToast: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
  <div className="fixed bottom-10 right-10 z-[200] animate-[slideIn_0.5s_ease-out_forwards]">
    <div className="bg-slate-900/90 backdrop-blur-3xl border border-cyan-400/40 p-5 rounded-2xl flex items-center gap-4 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
      <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-400/30">
        <i className={`fas ${achievement.icon} text-cyan-400 text-xl`}></i>
      </div>
      <div>
        <div className="text-cyan-400 text-[8px] font-black tracking-widest uppercase mb-1">Achievement Unlocked</div>
        <div className="text-white font-black text-lg tracking-tight">{achievement.title}</div>
        <div className="text-white/50 text-[10px] uppercase tracking-tighter">{achievement.description}</div>
      </div>
    </div>
  </div>
);

// Fix: Implemented the missing NavigationMenu component used for planet selection
const NavigationMenu: React.FC<{ 
  destinations: PlanetData[], 
  onSelect: (p: PlanetData) => void, 
  loading: boolean 
}> = ({ destinations, onSelect, loading }) => {
  return (
    <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-10">
      <div className="max-w-6xl w-full">
        <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Navigation Computer</h2>
            <p className="text-cyan-400 text-[10px] font-bold tracking-[0.4em] uppercase mt-2">Available Quantum Warp Destinations</p>
          </div>
          {loading && (
            <div className="flex items-center gap-3 text-cyan-400 animate-pulse">
              <i className="fas fa-circle-notch fa-spin"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Calculating Trajectories...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destinations.map((dest, i) => (
            <button
              key={i}
              onClick={() => onSelect(dest)}
              className="group relative bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 hover:border-cyan-500/50 transition-all text-left overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity" style={{ backgroundColor: dest.baseColor }} />
              
              <div className="relative z-10">
                <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-2">{dest.type} WORLD</div>
                <h3 className="text-3xl font-black mb-4 group-hover:text-cyan-400 transition-colors uppercase italic">{dest.name}</h3>
                <p className="text-white/40 text-[11px] leading-relaxed mb-6 line-clamp-3">{dest.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {dest.anomalies.slice(0, 2).map((a, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/5 rounded text-[8px] uppercase tracking-tighter text-white/60 font-bold border border-white/5">
                      {a}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                  <div className="text-center">
                    <div className="text-[8px] text-yellow-500/50 uppercase font-black mb-1">Minerals</div>
                    <div className="text-sm font-bold font-mono">{dest.resources.minerals}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-cyan-500/50 uppercase font-black mb-1">Energy</div>
                    <div className="text-sm font-bold font-mono">{dest.resources.energy}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-purple-500/50 uppercase font-black mb-1">Tech</div>
                    <div className="text-sm font-bold font-mono">{dest.resources.tech}</div>
                  </div>
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
  const [planet, setPlanet] = useState<PlanetData>(DEFAULT_PLANET);
  const [loading, setLoading] = useState(false);
  const [hyperdrive, setHyperdrive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [placingType, setPlacingType] = useState<BuildingType | null>(null);
  const [screenEffect, setScreenEffect] = useState<'none' | 'shake' | 'flash'>('none');
  
  const [destinations, setDestinations] = useState<PlanetData[]>([]);
  const [showNavMenu, setShowNavMenu] = useState(false);
  
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first_landing', title: 'Small Step', icon: 'fa-shoe-prints', description: 'Touch down on your first alien world.', unlocked: false },
    { id: 'master_builder', title: 'Industrialist', icon: 'fa-industry', description: 'Deploy 5 structures on a single planet.', unlocked: false },
    { id: 'warp_speed', title: 'Faster than Light', icon: 'fa-bolt', description: 'Initiate a hyperdrive jump.', unlocked: false },
  ]);
  const [unlockedToast, setUnlockedToast] = useState<Achievement | null>(null);

  const [missions, setMissions] = useState<Mission[]>([
    { id: 'init_colony', title: 'Establish Base', description: 'Build an extractor and a science lab.', target: 2, current: 0, type: 'build', requirement: 'Critical Structures', completed: false },
    { id: 'power_up', title: 'Grid Stability', description: 'Build 3 Solar Arrays.', target: 3, current: 0, type: 'build', requirement: 'Solar Panels', completed: false }
  ]);

  const [colony, setColony] = useState<ColonyState>({
    isEstablished: false,
    minerals: 10000,
    energy: 5000,
    tech: 0,
    buildings: []
  });

  const unlockAchievement = (id: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id === id && !a.unlocked) {
        const unlocked = { ...a, unlocked: true, unlockedAt: Date.now() };
        setUnlockedToast(unlocked);
        spaceAudio.playSuccess();
        setTimeout(() => setUnlockedToast(null), 5000);
        return unlocked;
      }
      return a;
    }));
  };

  const updateMissions = (buildings: Building[]) => {
    setMissions(prev => prev.map(m => {
      if (m.completed) return m;
      let current = 0;
      if (m.id === 'init_colony') {
        const hasExtractor = buildings.some(b => b.type === 'extractor');
        const hasLab = buildings.some(b => b.type === 'lab');
        current = (hasExtractor ? 1 : 0) + (hasLab ? 1 : 0);
      } else if (m.id === 'power_up') {
        current = buildings.filter(b => b.type === 'solar').length;
      }
      
      const completed = current >= m.target;
      if (completed && !m.completed) {
        spaceAudio.playSuccess();
      }
      return { ...m, current, completed };
    }));
  };

  const openNavigation = async () => {
    setLoading(true);
    setShowNavMenu(true);
    try {
      const data = await generatePlanetDestinations(3);
      setDestinations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startTravelTo = (selectedPlanet: PlanetData) => {
    setShowNavMenu(false);
    handleWarp(selectedPlanet);
  };

  const initiateVoyage = async () => {
    setScreenEffect('shake');
    spaceAudio.setEngine(1.0);
    setTimeout(() => {
      setScreenEffect('flash');
      setViewMode('ascending');
      setTimeout(() => setScreenEffect('none'), 1000);
    }, 1500);
  };

  const onAscendDone = async () => {
    setViewMode('orbit');
    const allMissionsDone = missions.every(m => m.completed);
    if (allMissionsDone) {
      openNavigation();
    }
  };

  const handleWarp = async (targetPlanet: PlanetData) => {
    unlockAchievement('warp_speed');
    setHyperdrive(true); 
    setScreenEffect('flash');
    spaceAudio.playWarp();
    
    setTimeout(() => {
      setScreenEffect('none');
      setPlanet(targetPlanet);
      setColony(prev => ({ ...prev, minerals: 10000, energy: 5000, tech: 0, buildings: [] }));
      // Reset missions for new planet
      setMissions(prev => prev.map(m => ({ ...m, current: 0, completed: false })));
      setHyperdrive(false); 
      setTimeout(() => setViewMode('landing'), 1500);
    }, 4000); 
  };

  const handleLanding = () => {
    setViewMode('landing');
    setScreenEffect('shake');
    setTimeout(() => setScreenEffect('none'), 2000);
  };

  useEffect(() => {
    if (viewMode === 'surface') {
      unlockAchievement('first_landing');
    }
  }, [viewMode]);

  useEffect(() => {
    if (colony.buildings.length >= 5) {
      unlockAchievement('master_builder');
    }
    updateMissions(colony.buildings);
  }, [colony.buildings]);

  useEffect(() => {
    if (!gameStarted) return;
    const keys = new Set<string>();
    const onKey = (e: KeyboardEvent) => {
      if (e.type === 'keydown') keys.add(e.key.toLowerCase());
      else keys.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    const update = () => {
      let dx = 0, dy = 0;
      if (keys.has('w')) dy -= 0.05;
      if (keys.has('s')) dy += 0.05;
      if (keys.has('a')) dx -= 0.05;
      if (keys.has('d')) dx += 0.05;
      setViewOffset(p => ({ x: (p.x + dx) * 0.92, y: (p.y + dy) * 0.92 }));
      spaceAudio.setEngine(keys.size > 0 ? 1 : (viewMode === 'orbit' ? 0.2 : 0));
      requestAnimationFrame(update);
    };
    const frame = requestAnimationFrame(update);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); cancelAnimationFrame(frame); };
  }, [gameStarted, viewMode]);

  useEffect(() => {
    if (!gameStarted || hyperdrive) return;
    const interval = setInterval(() => {
      setColony(prev => {
        let m = 10, e = 10, t = 0;
        prev.buildings.forEach(b => {
          if (b.type === 'extractor') m += 100;
          if (b.type === 'solar') e += 150;
          if (b.type === 'lab') t += 50;
          if (b.type === 'plants') e += 30;
        });
        return { ...prev, minerals: prev.minerals + m, energy: prev.energy + e, tech: prev.tech + t };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, hyperdrive]);

  const inventory: InventoryItem[] = [
    { type: 'extractor', name: 'Extractor', cost: 50, icon: 'fa-bore-hole', color: 'text-yellow-400' },
    { type: 'lab', name: 'Science Lab', cost: 100, icon: 'fa-microscope', color: 'text-purple-400' },
    { type: 'habitat', name: 'Colony Pod', cost: 80, icon: 'fa-house-user', color: 'text-blue-400' },
    { type: 'solar', name: 'Power Array', cost: 40, icon: 'fa-bolt', color: 'text-cyan-400' },
    { type: 'plants', name: 'Biodome', cost: 60, icon: 'fa-leaf', color: 'text-green-400' },
  ];

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black text-white select-none 
      ${screenEffect === 'shake' ? 'animate-[shake_0.2s_infinite]' : ''}`}>
      
      {screenEffect === 'flash' && (
        <div className="absolute inset-0 z-[150] bg-white animate-flash-out pointer-events-none" />
      )}

      <SimulationCanvas 
        key={`${planet.name}-${planet.radius}`} 
        planet={planet} 
        hyperdrive={hyperdrive} 
        viewOffset={viewOffset} 
        buildings={colony.buildings}
        viewMode={viewMode}
        onPlanetClick={() => viewMode === 'orbit' && !hyperdrive && handleLanding()}
        onPlaceBuilding={(pos) => {
          if (!placingType) return;
          const cost = inventory.find(i => i.type === placingType)?.cost || 0;
          if (colony.minerals >= cost) {
            setColony(prev => ({
              ...prev,
              minerals: prev.minerals - cost,
              buildings: [...prev.buildings, { id: Math.random().toString(), type: placingType, position: pos, timestamp: Date.now(), progress: 100 }]
            }));
            setPlacingType(null);
          }
        }}
        isPlacing={placingType}
        isStarted={gameStarted}
        onLandComplete={() => setViewMode('surface')}
        onAscendComplete={onAscendDone}
      />
      
      {(viewMode === 'orbit' || viewMode === 'ascending') && gameStarted && (
        <Cockpit3D tilt={viewOffset} isHyperdrive={hyperdrive} />
      )}

      {showNavMenu && (
        <NavigationMenu destinations={destinations} onSelect={startTravelTo} loading={loading} />
      )}

      {gameStarted && <MissionHUD missions={missions} />}
      {unlockedToast && <AchievementToast achievement={unlockedToast} />}

      {gameStarted && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-10 bg-black/80 backdrop-blur-2xl px-12 py-3 rounded-full border border-white/10 z-50 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-yellow-500 font-black uppercase tracking-widest">Minerals</span>
            <span className="text-xl font-bold font-mono text-white">{Math.floor(colony.minerals)}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-cyan-400 font-black uppercase tracking-widest">Energy</span>
            <span className="text-xl font-bold font-mono">{Math.floor(colony.energy)}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[7px] text-purple-400 font-black uppercase tracking-widest">Tech</span>
            <span className="text-xl font-bold font-mono">{Math.floor(colony.tech)}</span>
          </div>
        </div>
      )}

      {viewMode === 'surface' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl flex flex-col items-center gap-4">
          <div className="text-[10px] font-black text-white uppercase tracking-[0.4em] bg-cyan-600/60 px-8 py-3 rounded-full backdrop-blur-md border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
             {placingType ? `DEPLOYING ${placingType.toUpperCase()} - CLICK ON SURFACE` : "PLANETARY SURFACE VIEW - SELECT MODULE TO DEPLOY"}
          </div>
          <div className="bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 flex items-center justify-between shadow-[0_30px_60px_rgba(0,0,0,0.8)] w-full">
            <div className="flex gap-2">
              {inventory.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setPlacingType(placingType === item.type ? null : item.type)}
                  disabled={colony.minerals < item.cost}
                  className={`relative w-16 h-16 rounded-2xl transition-all flex flex-col items-center justify-center border-2
                    ${placingType === item.type ? 'bg-cyan-600/20 border-cyan-400 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white/5 border-transparent hover:bg-white/10'}
                    ${colony.minerals < item.cost ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100'}
                  `}
                >
                  <i className={`fas ${item.icon} text-lg mb-1 ${placingType === item.type ? 'text-cyan-300' : item.color}`}></i>
                  <span className="text-[6px] font-black uppercase tracking-tighter text-center">{item.name}</span>
                  <div className="absolute -top-1 -right-1 bg-black/80 px-1 rounded text-[5px] font-mono border border-white/10">
                    {item.cost}
                  </div>
                </button>
              ))}
            </div>
            <div className="h-12 w-px bg-white/5 mx-4" />
            <button
              onClick={initiateVoyage}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-cyan-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
            >
              Initiate Ascent
            </button>
          </div>
        </div>
      )}

      {viewMode === 'orbit' && gameStarted && !hyperdrive && !showNavMenu && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
          <button
            onClick={handleLanding}
            className="px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all border bg-cyan-600 border-cyan-400 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95"
          >
            Initiate Descent
          </button>
          <button
            onClick={openNavigation}
            className="px-8 py-5 bg-slate-900 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-slate-800"
          >
            Nav Computer
          </button>
        </div>
      )}

      {!gameStarted && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950 text-center px-12">
          <div className="max-w-3xl">
             <h1 className="text-[8rem] font-black mb-6 tracking-tighter uppercase italic leading-[0.5] drop-shadow-2xl">VOYAGE</h1>
             <p className="text-cyan-100/20 mb-16 text-sm uppercase tracking-[1em] font-light">Colonial Discovery & Expansion</p>
             <button 
              onClick={() => { spaceAudio.init(); setGameStarted(true); }}
              className="px-16 py-6 bg-cyan-600 text-white font-black rounded-xl hover:bg-cyan-500 transition-all uppercase tracking-[1em] text-lg shadow-2xl active:scale-95"
             >
              Engage
             </button>
             <div className="mt-12 text-[8px] text-white/20 uppercase tracking-widest">WASD to Steer • Orbit View: Click Planet to Land</div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-2px, 2px); } 50% { transform: translate(2px, -2px); } 75% { transform: translate(-2px, -2px); } }
      `}</style>
    </div>
  );
};

export default App;

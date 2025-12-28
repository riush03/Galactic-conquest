
import React, { useState, useCallback, useEffect } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Cockpit3D from './components/Cockpit3D';
import { DEFAULT_PLANET } from './constants';
import { PlanetData, ColonyState, BuildingType, ViewMode, InventoryItem } from './types';
import { generateNewPlanet } from './services/geminiService';
import { spaceAudio } from './services/audioService';

const SpaceHUD: React.FC<{ 
  speed: number, 
  targetName: string, 
  distance: string,
  isHyperdrive: boolean
}> = ({ speed, targetName, distance, isHyperdrive }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Corner Tech Brackets */}
      <div className="absolute top-12 left-12 w-32 h-32 border-t-4 border-l-4 border-cyan-400/30 rounded-tl-3xl" />
      <div className="absolute top-12 right-12 w-32 h-32 border-t-4 border-r-4 border-cyan-400/30 rounded-tr-3xl" />
      <div className="absolute bottom-12 left-12 w-32 h-32 border-b-4 border-l-4 border-cyan-400/30 rounded-bl-3xl" />
      <div className="absolute bottom-12 right-12 w-32 h-32 border-b-4 border-r-4 border-cyan-400/30 rounded-br-3xl" />

      {/* Speedometer Left */}
      <div className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        <div className="bg-cyan-900/20 backdrop-blur-md p-6 border-l-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Current Velocity</div>
          <div className="text-5xl font-black italic text-white flex items-baseline gap-2">
            {Math.floor(speed * 12500).toLocaleString()} <span className="text-xs not-italic text-cyan-500 font-mono">km/h</span>
          </div>
          <div className="mt-4 w-48 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] transition-all duration-300" style={{ width: `${Math.min(100, speed * 250)}%` }} />
          </div>
        </div>
        
        <div className="flex gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`h-8 w-1.5 rounded-full transition-all duration-300 ${i < speed * 20 ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-900/40'}`} />
          ))}
        </div>
      </div>

      {/* Target Tracker Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
        <div className="absolute inset-0 border border-cyan-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-10 border-t-2 border-b-2 border-cyan-400/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 text-center w-full">
           <div className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1 animate-pulse">Scanning Target...</div>
           <div className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            {isHyperdrive ? 'TRANSITION SPACE' : targetName.toUpperCase()}
           </div>
           <div className="text-sm font-mono text-cyan-400/80 mt-2">{isHyperdrive ? 'SIGNAL LOST' : `RANGE: ${distance}`}</div>
        </div>

        {/* Dynamic Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-cyan-400/50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-cyan-400/50" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-1 bg-cyan-400/50" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-1 bg-cyan-400/50" />
        </div>
      </div>

      {/* Right Side Telemetry */}
      <div className="absolute right-16 top-1/2 -translate-y-1/2 flex flex-col items-end gap-6 text-right">
         <div className="bg-slate-900/40 backdrop-blur-xl p-6 border-r-4 border-cyan-400 rounded-l-2xl">
            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Core Systems</div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 justify-end">
                <span className="text-[10px] font-bold text-white/60">REACTOR</span>
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '88%' }} />
                </div>
              </div>
              <div className="flex items-center gap-4 justify-end">
                <span className="text-[10px] font-bold text-white/60">LIFE SUPPORT</span>
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex items-center gap-4 justify-end">
                <span className="text-[10px] font-bold text-white/60">SHIELDS</span>
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const Minimap: React.FC<{ shipX: number, shipY: number }> = ({ shipX, shipY }) => {
  return (
    <div className="absolute bottom-16 right-16 w-56 h-56 bg-slate-950/60 backdrop-blur-3xl border-2 border-cyan-500/20 rounded-full z-40 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.1)]">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,cyan_1.5px,transparent_1.5px)] bg-[length:30px_30px] animate-[pulse_4s_infinite]" />
      <div className="absolute w-full h-full border border-cyan-500/10 rounded-full" />
      <div className="absolute w-3/4 h-3/4 border border-cyan-500/10 rounded-full" />
      <div className="absolute w-1/2 h-1/2 border border-cyan-500/10 rounded-full" />
      {/* Radar sweep */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/20 to-transparent rounded-full animate-[spin_4s_linear_infinite]" />
      
      {/* Target Dot */}
      <div className="w-10 h-10 bg-cyan-500/20 rounded-full blur-lg animate-pulse" />
      <div className="w-6 h-6 bg-cyan-400/40 rounded-full border border-cyan-300/50 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>

      {/* Ship Position */}
      <div 
        className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_20px_cyan] border-2 border-cyan-400 z-10 transition-transform duration-200"
        style={{ transform: `translate(${shipX * 80}px, ${shipY * 80}px)` }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-cyan-400 tracking-[0.4em]">Grid Sweep</div>
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
  const [viewPerspective, setViewPerspective] = useState<'internal' | 'external'>('external');
  
  const [colony, setColony] = useState<ColonyState>({
    isEstablished: false,
    minerals: 1000,
    energy: 500,
    tech: 0,
    buildings: []
  });

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
      setViewOffset(p => ({
        x: (p.x + dx) * 0.94,
        y: (p.y + dy) * 0.94
      }));
      spaceAudio.setEngine(keys.size > 0 ? 1 : 0);
      requestAnimationFrame(update);
    };
    const frame = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      cancelAnimationFrame(frame);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted || hyperdrive) return;
    const interval = setInterval(() => {
      setColony(prev => {
        let m = 1, e = 0.5, t = 0;
        prev.buildings.forEach(b => {
          if (b.type === 'extractor') m += planet.resources.minerals * 1.5;
          if (b.type === 'solar') e += planet.resources.energy * 2.0;
          if (b.type === 'lab') t += planet.resources.tech * 1.0;
          if (b.type === 'satellite') t += 5.0;
        });
        return { ...prev, minerals: prev.minerals + m, energy: prev.energy + e, tech: prev.tech + t };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, planet, hyperdrive]);

  const onPlaceBuilding = useCallback((pos: [number, number, number]) => {
    if (!placingType) return;
    const costs: Record<string, number> = { extractor: 150, solar: 100, lab: 300, habitat: 200, satellite: 500, drone: 80 };
    if (colony.minerals >= costs[placingType]) {
      setColony(prev => ({
        ...prev,
        isEstablished: true,
        minerals: prev.minerals - costs[placingType],
        buildings: [...prev.buildings, { 
          id: Math.random().toString(), 
          type: placingType, 
          position: pos, 
          timestamp: Date.now(),
          progress: 100 
        }]
      }));
    }
  }, [placingType, colony.minerals]);

  const handleWarp = async () => {
    setLoading(true);
    setHyperdrive(true);
    setViewMode('orbit');
    spaceAudio.playWarp();
    try {
      const newPlanet = await generateNewPlanet();
      setTimeout(() => {
        setPlanet(newPlanet);
        setColony(prev => ({ ...prev, isEstablished: false, buildings: [] }));
        setHyperdrive(false);
        setLoading(false);
        setPlacingType(null);
      }, 4000); 
    } catch (e) {
      setHyperdrive(false);
      setLoading(false);
    }
  };

  const inventoryItems: InventoryItem[] = [
    { type: 'habitat', name: 'Modular Habitat', cost: 200, icon: 'fa-house-chimney-window', color: 'text-blue-400' },
    { type: 'extractor', name: 'Mining Rig', cost: 150, icon: 'fa-bore-hole', color: 'text-yellow-400' },
    { type: 'solar', name: 'Solar Array', cost: 100, icon: 'fa-solar-panel', color: 'text-cyan-400' },
    { type: 'lab', name: 'Science Pod', cost: 300, icon: 'fa-microscope', color: 'text-purple-400' },
    { type: 'satellite', name: 'Orbital Sat', cost: 500, icon: 'fa-satellite', color: 'text-white' },
    { type: 'drone', name: 'Repair Drone', cost: 80, icon: 'fa-robot', color: 'text-green-400' }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white select-none font-sans">
      <SimulationCanvas 
        planet={planet} 
        hyperdrive={hyperdrive} 
        viewOffset={viewOffset} 
        buildings={colony.buildings}
        viewMode={viewMode}
        onPlanetClick={() => viewMode === 'orbit' && !hyperdrive && setViewMode('landing')}
        onPlaceBuilding={onPlaceBuilding}
        isPlacing={placingType}
        isStarted={gameStarted}
        onBuildingSelect={setPlacingType}
        onLandComplete={() => setViewMode('surface')}
      />
      
      {viewMode === 'orbit' && gameStarted && viewPerspective === 'internal' && (
        <Cockpit3D tilt={viewOffset} isHyperdrive={hyperdrive} />
      )}

      {/* SPACE HUD Overlay */}
      {gameStarted && viewMode === 'orbit' && (
        <SpaceHUD 
          speed={hyperdrive ? 1.5 : (Math.abs(viewOffset.x) + Math.abs(viewOffset.y)) / 2 + 0.1} 
          targetName={planet.name}
          distance={hyperdrive ? "SIGNAL LOST" : `${Math.floor(planet.radius * 25.5)} AU`}
          isHyperdrive={hyperdrive}
        />
      )}

      {/* Orbit Minimap */}
      {gameStarted && viewMode === 'orbit' && !hyperdrive && (
        <Minimap shipX={viewOffset.x} shipY={viewOffset.y} />
      )}

      {/* Resource HUD */}
      {gameStarted && !hyperdrive && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-10 z-40 bg-slate-950/60 backdrop-blur-3xl px-14 py-5 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest mb-1">Minerals</span>
            <span className="text-2xl font-black font-mono text-white tracking-tighter">{Math.floor(colony.minerals)}</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10 px-10">
            <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-1">Energy</span>
            <span className="text-2xl font-black font-mono text-white tracking-tighter">{Math.floor(colony.energy)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-1">Science</span>
            <span className="text-2xl font-black font-mono text-white tracking-tighter">{Math.floor(colony.tech)}</span>
          </div>
        </div>
      )}

      {/* Perspective Toggle */}
      {gameStarted && viewMode === 'orbit' && !hyperdrive && (
        <button 
          onClick={() => setViewPerspective(p => p === 'internal' ? 'external' : 'internal')}
          className="absolute top-10 right-10 z-40 w-16 h-16 rounded-3xl bg-slate-900/80 hover:bg-cyan-500/20 border border-cyan-500/20 backdrop-blur-2xl transition-all flex items-center justify-center shadow-xl active:scale-90"
        >
          <i className={`fas ${viewPerspective === 'internal' ? 'fa-eye' : 'fa-user'} text-xl text-cyan-400`}></i>
        </button>
      )}

      {/* Surface UI Inventory */}
      {viewMode === 'surface' && !loading && !hyperdrive && (
        <>
          <button 
            onClick={() => { setViewMode('orbit'); setPlacingType(null); }}
            className="absolute top-36 right-12 z-40 bg-slate-900/80 hover:bg-cyan-500/20 backdrop-blur-3xl border border-cyan-500/20 px-10 py-5 rounded-[2rem] flex items-center gap-5 transition-all active:scale-95 shadow-2xl group"
          >
            <i className="fas fa-rocket text-xl text-cyan-400 group-hover:animate-bounce"></i>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-50">Liftoff to Orbit</span>
          </button>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-6xl px-10">
            <div className="bg-slate-950/80 backdrop-blur-3xl border border-cyan-500/20 rounded-[4rem] p-10 flex items-center justify-around shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-auto no-scrollbar gap-10">
              {inventoryItems.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setPlacingType(placingType === item.type ? null : item.type)}
                  disabled={colony.minerals < item.cost}
                  className={`relative flex flex-col items-center justify-center min-w-[140px] h-40 rounded-[3rem] transition-all flex-shrink-0
                    ${placingType === item.type ? 'bg-cyan-600 shadow-[0_0_40px_rgba(6,182,212,0.4)] scale-110' : 'hover:bg-white/5'}
                    ${colony.minerals < item.cost ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100'}
                  `}
                >
                  <i className={`fas ${item.icon} text-4xl mb-4 ${placingType === item.type ? 'text-white' : item.color}`}></i>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${placingType === item.type ? 'text-white' : 'text-slate-400'}`}>
                    {item.name}
                  </span>
                  <div className="absolute -top-3 -right-3 bg-cyan-950 px-4 py-2 rounded-2xl text-xs font-black border-2 border-cyan-500/40 text-cyan-400 shadow-xl">
                    {item.cost}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Orbit Interaction Buttons */}
      {viewMode === 'orbit' && gameStarted && !hyperdrive && (
        <div className="absolute inset-x-0 bottom-16 z-30 flex flex-col items-center gap-10 px-16">
          <div className="flex gap-12">
             <button
                onClick={() => setViewMode('landing')}
                className="px-20 py-10 bg-cyan-600 hover:bg-cyan-500 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-cyan-600/40 active:scale-95 flex items-center gap-6 text-white border-b-4 border-cyan-700"
              >
                <i className="fas fa-satellite-dish text-xl"></i>
                Initialize Landing
              </button>
              <button
                onClick={handleWarp}
                disabled={loading}
                className="px-16 py-10 bg-slate-900/60 hover:bg-slate-800/80 border-2 border-white/10 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 backdrop-blur-2xl flex items-center gap-6 shadow-xl"
              >
                <i className={`fas fa-forward text-xl ${loading ? 'animate-spin' : ''}`}></i>
                {loading ? 'Warp Charging...' : 'Next Sector'}
              </button>
          </div>
          <div className="text-cyan-400/50 text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-8">
            <span className="bg-cyan-500/10 px-6 py-3 rounded-full border border-cyan-500/20 backdrop-blur-sm shadow-lg">W-A-S-D: Navigation</span>
            <span className="bg-cyan-500/10 px-6 py-3 rounded-full border border-cyan-500/20 backdrop-blur-sm shadow-lg">SPACE: Pulse Cannons</span>
          </div>
        </div>
      )}

      {/* Initial Landing Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl px-12 text-center">
          <div className="max-w-4xl animate-in fade-in zoom-in duration-1000">
             <div className="w-48 h-48 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 rounded-[4rem] mx-auto mb-16 flex items-center justify-center shadow-[0_0_100px_rgba(6,182,212,0.4)] rotate-12 relative">
               <i className="fas fa-shuttle-space text-8xl text-white"></i>
               <div className="absolute inset-0 border-4 border-white/20 rounded-[4rem] animate-ping" />
             </div>
             <h1 className="text-[14rem] font-black mb-8 tracking-tighter uppercase italic leading-[0.6] drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">VOYAGE</h1>
             <p className="text-cyan-100/60 mb-20 text-3xl leading-relaxed font-light max-w-2xl mx-auto uppercase tracking-[0.4em]">
               System Check: 100%<br/>
               Initialize Colony Protocol v4.2
             </p>
             <button 
              onClick={() => { spaceAudio.init(); setGameStarted(true); }}
              className="px-40 py-12 bg-cyan-500 text-white font-black rounded-[3rem] hover:bg-cyan-400 transition-all uppercase tracking-[0.8em] text-2xl shadow-[0_0_60px_rgba(6,182,212,0.5)] active:scale-95"
             >
              ENGAGE
             </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center pointer-events-none">
           <div className="text-center">
             <div className="w-32 h-32 border-8 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin mx-auto mb-12 shadow-[0_0_50px_rgba(6,182,212,0.2)]" />
             <h4 className="text-sm font-black uppercase tracking-[1.5em] text-cyan-400 animate-pulse">WARP SINGULARITY ACTIVE</h4>
           </div>
        </div>
      )}

      {viewMode === 'landing' && (
        <div className="absolute inset-0 z-[60] bg-cyan-950/30 backdrop-blur-[6px] animate-pulse pointer-events-none flex items-center justify-center border-4 border-cyan-500/20">
           <h2 className="text-7xl font-black italic tracking-[0.8em] text-cyan-400 animate-bounce">ENTRY PHASE ONE</h2>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_1000px_rgba(0,0,0,1)] z-10" />
    </div>
  );
};

export default App;

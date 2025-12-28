
import React, { useState, useCallback, useEffect } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Cockpit3D from './components/Cockpit3D';
import { DEFAULT_PLANET } from './constants';
import { PlanetData, ColonyState, BuildingType, ViewMode } from './types';
import { generateNewPlanet } from './services/geminiService';
import { spaceAudio } from './services/audioService';

const App: React.FC = () => {
  const [planet, setPlanet] = useState<PlanetData>(DEFAULT_PLANET);
  const [loading, setLoading] = useState(false);
  const [hyperdrive, setHyperdrive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [placingType, setPlacingType] = useState<BuildingType | null>(null);
  
  const [colony, setColony] = useState<ColonyState>({
    isEstablished: false,
    minerals: 250,
    energy: 150,
    tech: 0,
    buildings: []
  });

  // Cockpit view momentum (only in orbit)
  useEffect(() => {
    if (!gameStarted || viewMode === 'surface') {
      setViewOffset({ x: 0, y: 0 });
      return;
    }
    const keys = new Set<string>();
    const onKey = (e: KeyboardEvent) => {
      if (e.type === 'keydown') keys.add(e.key.toLowerCase());
      else keys.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    const update = () => {
      let dx = 0, dy = 0;
      if (keys.has('w')) dy -= 0.03;
      if (keys.has('s')) dy += 0.03;
      if (keys.has('a')) dx -= 0.03;
      if (keys.has('d')) dx += 0.03;

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
  }, [gameStarted, viewMode]);

  // Resource Tick
  useEffect(() => {
    if (!gameStarted || hyperdrive) return;
    const interval = setInterval(() => {
      setColony(prev => {
        let m = 0.5, e = 0.2, t = 0;
        prev.buildings.forEach(b => {
          if (b.type === 'extractor') m += planet.resources.minerals * 0.5;
          if (b.type === 'solar') e += planet.resources.energy * 0.5;
          if (b.type === 'lab') t += planet.resources.tech * 0.2;
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
  }, [gameStarted, planet, hyperdrive]);

  const onPlaceBuilding = useCallback((pos: [number, number, number]) => {
    if (!placingType) return;
    const costs = { extractor: 50, solar: 30, lab: 100, habitat: 60 };
    if (colony.minerals >= costs[placingType]) {
      setColony(prev => ({
        ...prev,
        isEstablished: true,
        minerals: prev.minerals - costs[placingType],
        buildings: [...prev.buildings, { id: Math.random().toString(), type: placingType, position: pos }]
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
      }, 3000);
    } catch (e) {
      setHyperdrive(false);
      setLoading(false);
    }
  };

  const inventoryItems = [
    { type: 'habitat', label: 'Habitat', cost: 60, icon: 'fa-house-chimney-window', color: 'text-blue-400' },
    { type: 'extractor', label: 'Mine', cost: 50, icon: 'fa-bore-hole', color: 'text-yellow-400' },
    { type: 'solar', label: 'Solar', cost: 30, icon: 'fa-solar-panel', color: 'text-cyan-400' },
    { type: 'lab', label: 'Lab', cost: 100, icon: 'fa-microscope', color: 'text-purple-400' }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white select-none font-sans">
      <SimulationCanvas 
        planet={planet} 
        hyperdrive={hyperdrive} 
        viewOffset={viewOffset} 
        buildings={colony.buildings}
        viewMode={viewMode}
        onPlanetClick={() => viewMode === 'orbit' && setViewMode('surface')}
        onPlaceBuilding={onPlaceBuilding}
        isPlacing={placingType}
        isStarted={gameStarted}
      />
      
      {viewMode === 'orbit' && gameStarted && (
        <Cockpit3D tilt={viewOffset} isHyperdrive={hyperdrive} />
      )}

      {/* Resource HUD */}
      {gameStarted && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-12 z-40 bg-slate-900/60 backdrop-blur-3xl px-12 py-5 rounded-full border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest mb-1">Minerals</span>
            <span className="text-2xl font-black font-mono">{Math.floor(colony.minerals)}</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/10 px-12">
            <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-1">Energy</span>
            <span className="text-2xl font-black font-mono">{Math.floor(colony.energy)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-1">Research</span>
            <span className="text-2xl font-black font-mono">{Math.floor(colony.tech)}</span>
          </div>
        </div>
      )}

      {/* Surface UI */}
      {viewMode === 'surface' && !loading && (
        <>
          <button 
            onClick={() => { setViewMode('orbit'); setPlacingType(null); }}
            className="absolute top-32 right-10 z-40 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95"
          >
            <i className="fas fa-rocket text-sm"></i>
            <span className="text-[11px] font-black uppercase tracking-widest">Orbit View</span>
          </button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-6">
            <div className="bg-slate-900/70 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-5 flex items-center justify-around shadow-2xl">
              {inventoryItems.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setPlacingType(placingType === item.type ? null : (item.type as BuildingType))}
                  disabled={colony.minerals < item.cost}
                  className={`relative flex flex-col items-center justify-center w-24 h-28 rounded-[2rem] transition-all
                    ${placingType === item.type ? 'bg-blue-600 shadow-xl scale-110' : 'hover:bg-white/5'}
                    ${colony.minerals < item.cost ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100'}
                  `}
                >
                  <i className={`fas ${item.icon} text-2xl mb-3 ${placingType === item.type ? 'text-white' : item.color}`}></i>
                  <span className={`text-[10px] font-black uppercase tracking-tight ${placingType === item.type ? 'text-white' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                  <span className="absolute -top-1 -right-1 bg-black/80 px-2 py-1 rounded-lg text-[9px] font-mono border border-white/10">
                    {item.cost}
                  </span>
                </button>
              ))}
            </div>
            {placingType && (
              <div className="text-center mt-6">
                <p className="text-[11px] font-black text-blue-300 uppercase tracking-[0.4em] animate-pulse">
                  Deploying {placingType}... Tap Planet
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Orbit UI */}
      {viewMode === 'orbit' && gameStarted && (
        <div className="absolute inset-x-0 bottom-12 z-30 flex flex-col items-center gap-8 px-12">
          <div className="bg-slate-950/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Target Identified</h3>
            <h2 className="text-4xl font-black tracking-tighter leading-tight">{planet.name}</h2>
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed italic opacity-70">"{planet.description}"</p>
          </div>

          <div className="flex gap-6">
             <button
                onClick={() => setViewMode('surface')}
                className="px-14 py-7 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 active:scale-95"
              >
                Enter Atmosphere
              </button>
              <button
                onClick={handleWarp}
                disabled={loading}
                className="px-10 py-7 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 backdrop-blur-md"
              >
                {loading ? 'Initiating...' : 'Next Sector'}
              </button>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-10">
          <div className="max-w-2xl text-center">
             <div className="w-28 h-28 bg-gradient-to-tr from-blue-700 to-cyan-500 rounded-[2.5rem] mx-auto mb-12 flex items-center justify-center shadow-2xl shadow-blue-500/30 rotate-12">
               <i className="fas fa-shuttle-space text-5xl text-white"></i>
             </div>
             <h1 className="text-9xl font-black mb-10 tracking-tighter uppercase italic leading-[0.75]">Star<br/>Colony</h1>
             <p className="text-slate-100 mb-14 text-xl leading-relaxed font-light drop-shadow-lg">
               Establish a foothold in the galaxy. Survey strange worlds, manage resources, and build your frontier colony.
             </p>
             <button 
              onClick={() => { spaceAudio.init(); setGameStarted(true); }}
              className="px-24 py-9 bg-white text-black font-black rounded-[2rem] hover:bg-blue-400 hover:text-white transition-all uppercase tracking-[0.4em] shadow-2xl active:scale-95"
             >
              Take Command
             </button>
          </div>
        </div>
      )}

      {hyperdrive && <div className="absolute inset-0 z-50 bg-white/5 backdrop-blur-[1px] animate-pulse pointer-events-none" />}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_500px_rgba(0,0,0,1)] z-10" />
    </div>
  );
};

export default App;

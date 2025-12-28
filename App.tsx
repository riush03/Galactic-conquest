
import React, { useState, useCallback, useEffect, useRef } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Spaceship from './components/Spaceship';
import { DEFAULT_PLANET } from './constants';
import { PlanetData } from './types';
import { generateNewPlanet } from './services/geminiService';
import { spaceAudio } from './services/audioService';

const App: React.FC = () => {
  const [planet, setPlanet] = useState<PlanetData>(DEFAULT_PLANET);
  const [loading, setLoading] = useState(false);
  const [hyperdrive, setHyperdrive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Ship State
  const [shipPos, setShipPos] = useState({ x: 25, y: 50 });
  const [shipRotation, setShipRotation] = useState(0);
  const [shipTilt, setShipTilt] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);

  const keysPressed = useRef<Set<string>>(new Set());

  // Input Handling Loop
  useEffect(() => {
    if (!gameStarted) return;

    let animationId: number;
    const speed = 0.5;

    const updateShip = () => {
      let dx = 0;
      let dy = 0;

      if (keysPressed.current.has('w') || keysPressed.current.has('ArrowUp')) dy -= 1;
      if (keysPressed.current.has('s') || keysPressed.current.has('ArrowDown')) dy += 1;
      if (keysPressed.current.has('a') || keysPressed.current.has('ArrowLeft')) dx -= 1;
      if (keysPressed.current.has('d') || keysPressed.current.has('ArrowRight')) dx += 1;

      const moving = dx !== 0 || dy !== 0;
      setIsMoving(moving);
      spaceAudio.setEngine(moving ? 1 : 0);

      if (moving) {
        setShipPos(prev => ({
          x: Math.max(5, Math.min(95, prev.x + dx * speed)),
          y: Math.max(10, Math.min(90, prev.y + dy * speed))
        }));

        // Rotation & Tilt Logic
        const targetRot = Math.atan2(dy, dx) * (180 / Math.PI);
        setShipRotation(targetRot);
        setShipTilt({
          x: dx * 20, // Horizontal tilt
          y: -dy * 20 // Vertical tilt
        });
      } else {
        setShipTilt({ x: 0, y: 0 });
      }

      animationId = requestAnimationFrame(updateShip);
    };

    updateShip();
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => keysPressed.current.add(e.key.toLowerCase());
    const handleUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  const handleStart = () => {
    spaceAudio.init();
    setGameStarted(true);
  };

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setHyperdrive(true);
    spaceAudio.playWarp();
    try {
      const newPlanet = await generateNewPlanet();
      setTimeout(() => {
        setPlanet(newPlanet);
        setHyperdrive(false);
        setLoading(false);
        setShowInfo(true);
      }, 2000);
    } catch (error) {
      setHyperdrive(false);
      setLoading(false);
    }
  }, [loading]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white select-none font-sans">
      {/* Simulation Layer */}
      <SimulationCanvas planet={planet} hyperdrive={hyperdrive} shipY={shipPos.y} />

      {/* Spaceship Layer */}
      <Spaceship 
        x={shipPos.x} 
        y={shipPos.y} 
        rotation={shipRotation} 
        tilt={shipTilt}
        isHyperdrive={hyperdrive} 
        moving={isMoving}
      />

      {/* Start Screen Overlay */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full p-8 rounded-3xl border border-white/10 bg-slate-900/50 text-center shadow-2xl">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
              <i className="fas fa-rocket text-3xl animate-bounce"></i>
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-4 uppercase">Cosmos Explorer</h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Welcome to the helm, Commander. You are piloting a long-range exploration vessel. 
              Search for new worlds, discover atmospheric anomalies, and traverse the stars.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8 text-xs font-mono text-slate-500 uppercase">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-blue-400 mb-1">Navigation</p>
                WASD / Arrows
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-blue-400 mb-1">Hyperdrive</p>
                Action Button
              </div>
            </div>
            <button 
              onClick={handleStart}
              className="w-full py-4 bg-white text-black font-black rounded-full hover:bg-blue-400 hover:text-white transition-all transform active:scale-95"
            >
              INITIATE LAUNCH
            </button>
          </div>
        </div>
      )}

      {/* HUD Navigation UI */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-30 pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <h1 className="text-xl font-black tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Cosmos Explorer
          </h1>
          <span className="text-[10px] text-slate-500 font-mono">SECTOR: {planet.name.toUpperCase()} // GRID 774-X</span>
        </div>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-4">
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`p-3 rounded-xl border transition-all backdrop-blur-md ${showInfo ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <i className="fas fa-satellite-dish"></i>
              </button>
          </div>
          <div className="text-[10px] font-mono text-right text-slate-500">
            AUDIO: {gameStarted ? 'SYNTH_ACTIVE' : 'MUTED'}<br/>
            COORD_X: {shipPos.x.toFixed(1)}%<br/>
            COORD_Y: {shipPos.y.toFixed(1)}%
          </div>
        </div>
      </nav>

      {/* Comms Panel (Replaced Xylos-9 container) */}
      {showInfo && !hyperdrive && (
        <div className="absolute right-6 top-24 w-72 z-30 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="bg-slate-900/80 backdrop-blur-xl border-l-4 border-blue-500 p-5 shadow-2xl rounded-r-2xl">
            <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-tighter">Planetary Intelligence</h3>
            <h2 className="text-xl font-black mb-3">{planet.name}</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{planet.description}</p>
            <div className="space-y-2">
               {planet.anomalies.map((a, i) => (
                 <div key={i} className="flex items-center gap-2 text-[10px] text-blue-200">
                   <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                   {a}
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Controls - Bottom */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-30 w-full max-w-lg px-6 flex justify-between items-end">
        <div className="flex flex-col gap-2">
            <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${shipPos.y}%` }} />
            </div>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Vertical Stabilization</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !gameStarted}
          className={`
            group relative px-10 py-5 rounded-full font-black transition-all overflow-hidden shadow-2xl
            ${loading ? 'bg-slate-800 text-slate-500' : 'bg-white text-black hover:scale-105 active:scale-95'}
          `}
        >
          {loading && <div className="absolute inset-0 bg-blue-600 animate-pulse opacity-20"></div>}
          <span className="relative flex items-center gap-4">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-forward"></i>}
            {loading ? 'CALCULATING JUMP...' : 'NEW SECTOR'}
          </span>
        </button>

        <div className="flex flex-col items-end gap-2">
             <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-6 rounded-full ${isMoving ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`} style={{ animationDelay: `${i*0.1}s` }} />
                ))}
             </div>
             <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-right">Engine Output</p>
        </div>
      </div>

      {/* Warp Visuals */}
      {hyperdrive && (
        <div className="absolute inset-0 z-40 bg-white animate-flash-out pointer-events-none"></div>
      )}
    </div>
  );
};

export default App;

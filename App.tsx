
import React, { useState, useEffect } from 'react';
import SimulationCanvas from './components/SimulationCanvas.tsx';
import WarpOverlay from './components/WarpOverlay.tsx';
import CelestialInfoModal from './components/CelestialInfoModal.tsx';
import NavigationDeck from './components/NavigationDeck.tsx';
import BuildingHotbar from './components/BuildingHotbar.tsx';
import MissionTracker from './components/MissionTracker.tsx';
import AchievementPanel from './components/AchievementPanel.tsx';
import BuildingDetailsModal from './components/BuildingDetailsModal.tsx';
import { LEVELS as INITIAL_LEVELS, ACHIEVEMENTS as INITIAL_ACHIEVEMENTS } from './constants.ts';
import { ViewMode, LevelDef, Building, BuildingType, BuildingCategory, Achievement } from './types.ts';
import { spaceAudio } from './services/audioService.ts';

export const BUILDING_REGISTRY: Record<BuildingType, { name: string; cost: number; icon: string; cat: BuildingCategory; description: string; stats: string }> = {
  extractor: { 
    name: 'Mineral Extractor', 
    cost: 10, 
    icon: 'fa-bore-hole', 
    cat: 'colony', 
    description: 'A high-powered thermal drill designed to extract rare earth minerals from the crust.',
    stats: 'Minerals: +2.5/cycle'
  },
  solar: { 
    name: 'Solar Array', 
    cost: 5, 
    icon: 'fa-solar-panel', 
    cat: 'colony', 
    description: 'Photovoltaic cells optimized for high-intensity solar radiation capture.',
    stats: 'Energy: +5.0/cycle'
  },
  habitat: { 
    name: 'Habitation Pod', 
    cost: 15, 
    icon: 'fa-house-chimney-window', 
    cat: 'colony', 
    description: 'Pressurized living quarters for personnel, featuring artificial gravity and shielding.',
    stats: 'Capacity: 4 Units'
  },
  lab: { 
    name: 'Research Lab', 
    cost: 20, 
    icon: 'fa-flask-vial', 
    cat: 'science', 
    description: 'A sterile environment for analyzing planetary samples and biological anomalies.',
    stats: 'Tech: +1.2/cycle'
  },
  drone: { 
    name: 'Maintenance Drone', 
    cost: 8, 
    icon: 'fa-robot', 
    cat: 'colony', 
    description: 'Autonomous repair unit that monitors structural integrity of local modules.',
    stats: 'Repair: Auto'
  },
  rover: { 
    name: 'Surface Rover', 
    cost: 12, 
    icon: 'fa-car-side', 
    cat: 'colony', 
    description: 'Rugged all-terrain vehicle for geological surveys and resource scouting.',
    stats: 'Speed: 45 km/h'
  },
  flag: { 
    name: 'Sector Flag', 
    cost: 2, 
    icon: 'fa-flag', 
    cat: 'colony', 
    description: 'Symbolic marker representing the claim of this sector for scientific study.',
    stats: 'Status: Claimed'
  },
  plants: { 
    name: 'Bio-Dome', 
    cost: 25, 
    icon: 'fa-seedling', 
    cat: 'colony', 
    description: 'Experimental garden dome testing botanical growth in alien atmosphere conditions.',
    stats: 'Oxygen: Low'
  },
  station_core: { 
    name: 'Station Core', 
    cost: 50, 
    icon: 'fa-hubspot', 
    cat: 'station', 
    description: 'The central node of an orbital complex, providing power distribution and life support.',
    stats: 'Power: Core Level'
  },
  station_wing: { 
    name: 'Solar Wing', 
    cost: 20, 
    icon: 'fa-bridge', 
    cat: 'station', 
    description: 'Extension wing for orbital stations, maximizing energy collection surfaces.',
    stats: 'Energy: +12.0/cycle'
  },
  station_dock: { 
    name: 'Docking Bay', 
    cost: 30, 
    icon: 'fa-anchor', 
    cat: 'station', 
    description: 'A reinforced airlock structure allowing safe transit between shuttles and the station.',
    stats: 'Transits: Unlimited'
  },
  shuttle: { 
    name: 'Transport Shuttle', 
    cost: 15, 
    icon: 'fa-shuttle-space', 
    cat: 'station', 
    description: 'Short-range vessel for transporting crew and equipment across orbital paths.',
    stats: 'Cargo: 500kg'
  },
  satellite: { 
    name: 'Comms Satellite', 
    cost: 10, 
    icon: 'fa-satellite', 
    cat: 'science', 
    description: 'High-orbit relay satellite ensuring continuous communication with Earth base.',
    stats: 'Uplink: 10Gbps'
  },
  telescope: { 
    name: 'Array Telescope', 
    cost: 25, 
    icon: 'fa-binoculars', 
    cat: 'science', 
    description: 'Ultra-sensitive radio telescope array capable of detecting deep-space signatures.',
    stats: 'Range: 50 LY'
  },
  comm_dish: { 
    name: 'Signal Dish', 
    cost: 12, 
    icon: 'fa-tower-broadcast', 
    cat: 'science', 
    description: 'Surface-mounted parabolic antenna for long-range planetary transmissions.',
    stats: 'Lat: <1.0ms'
  },
};

export default function App() {
  const [availableLevels] = useState<LevelDef[]>(INITIAL_LEVELS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [levelIndex, setLevelIndex] = useState(3);
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [hyperdrive, setHyperdrive] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [hasBegun, setHasBegun] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  const [inspectingBuilding, setInspectingBuilding] = useState<BuildingType | null>(null);
  const [minerals, setMinerals] = useState(250); 
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());
  const [visitedPlanets, setVisitedPlanets] = useState<Set<number>>(new Set([3]));

  const currentLevel = availableLevels[levelIndex];

  // Logic for missions and achievements
  useEffect(() => {
    if (!hasBegun) return;

    // Mission check
    availableLevels.forEach(lvl => {
      const lvlBuildings = buildings.filter(b => b.planetIndex === lvl.index);
      lvl.missions.forEach(mission => {
        if (!completedMissionIds.has(mission.id)) {
          const currentCount = mission.buildingType 
            ? lvlBuildings.filter(b => b.type === mission.buildingType).length
            : lvlBuildings.length;
          if (currentCount >= mission.target) {
            setCompletedMissionIds(prev => new Set(prev).add(mission.id));
            spaceAudio.playSuccess();
            notify(`MISSION COMPLETED: ${mission.title.toUpperCase()}`);
            setMinerals(m => m + 100); // Reward for mission
          }
        }
      });
    });

    // Achievement check
    const stateForAch = { buildings, minerals, visitedPlanets };
    const updatedAchs = achievements.map(ach => {
      if (!ach.unlocked && ach.condition(stateForAch)) {
        spaceAudio.playSuccess();
        notify(`ACHIEVEMENT UNLOCKED: ${ach.title.toUpperCase()}`);
        return { ...ach, unlocked: true };
      }
      return ach;
    });
    
    // Only update if something changed
    if (JSON.stringify(updatedAchs) !== JSON.stringify(achievements)) {
      setAchievements(updatedAchs);
    }
  }, [buildings, minerals, visitedPlanets, availableLevels, completedMissionIds, achievements, hasBegun]);

  const handleStart = () => {
    spaceAudio.init();
    setHasBegun(true);
    spaceAudio.playSuccess();
    setTimeout(() => {
      setViewMode('focus');
    }, 500);
  };

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const travelToPlanet = (index: number) => {
    if (index === levelIndex) return;
    setHyperdrive(true);
    spaceAudio.playWarp();
    notify(`ENGAGING WARP: ${availableLevels[index].planet.name.toUpperCase()}`);
    
    setTimeout(() => {
      setLevelIndex(index);
      setVisitedPlanets(prev => new Set(prev).add(index));
      setHyperdrive(false);
      setViewMode('focus');
      setSelectedBuildingType(null);
    }, 4000);
  };

  const handlePlanetClick = (surfacePoint?: [number, number, number]) => {
    if (selectedBuildingType && surfacePoint) {
      const info = BUILDING_REGISTRY[selectedBuildingType];
      if (minerals >= info.cost) {
        const newBuilding: Building = {
          id: Math.random().toString(36).substr(2, 9),
          type: selectedBuildingType,
          category: info.cat,
          position: surfacePoint,
          planetIndex: levelIndex
        };
        setBuildings(prev => [...prev, newBuilding]);
        setMinerals(prev => prev - info.cost);
        spaceAudio.playSuccess();
      } else {
        spaceAudio.playError();
        notify("INSUFFICIENT RESOURCES");
      }
    } else {
      spaceAudio.playSelect();
      setShowInfo(!showInfo);
    }
  };

  if (!hasBegun) {
    return (
      <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative text-center animate-[whoa_0.8s_ease-out]">
          <h1 className="text-[12rem] font-black italic tracking-tighter uppercase text-white leading-none opacity-10">Cosmos</h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <h2 className="text-7xl font-black uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">Odyssey</h2>
             <button 
               onClick={handleStart}
               className="mt-12 px-16 py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl uppercase tracking-[0.5em] rounded-full transition-all shadow-[0_0_50px_rgba(8,145,178,0.4)] hover:scale-110 active:scale-95 border-2 border-cyan-400/50"
             >
               Initiate Link
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative bg-slate-950 flex overflow-hidden">
      <SimulationCanvas 
        levels={availableLevels} 
        activeIndex={levelIndex} 
        hyperdrive={hyperdrive}
        viewMode={viewMode}
        buildings={buildings}
        selectedBuildingType={selectedBuildingType}
        onPlanetClick={handlePlanetClick}
      />

      {/* Sidebar Nav */}
      <div className="relative z-10 h-full flex-shrink-0">
        <NavigationDeck levels={availableLevels} currentIndex={levelIndex} onSelect={travelToPlanet} />
      </div>

      {/* Main UI Overlay */}
      <div className="flex-1 relative z-10 flex flex-col pointer-events-none overflow-hidden">
        {/* Header UI */}
        <div className="p-8 flex justify-end items-center gap-4">
          <button 
            onClick={() => { spaceAudio.playSelect(); setShowAchievements(true); }}
            className="pointer-events-auto bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-full p-6 text-yellow-500 hover:text-yellow-400 hover:bg-white/10 transition-all shadow-2xl animate-[slideIn_0.4s_ease-out]"
          >
            <i className="fas fa-trophy text-2xl" />
          </button>
          
          <div className="bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-center gap-8 shadow-2xl animate-[slideIn_0.4s_ease-out] pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest text-right">Credits</span>
              <span className="text-3xl font-black text-white italic">{minerals}</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Active Orbit</span>
              <span className="text-xl font-black text-white uppercase tracking-tighter">{currentLevel.planet.name}</span>
            </div>
          </div>
        </div>

        {/* Mission Tracker */}
        <div className="absolute top-8 left-8 ml-[380px]"> 
           <MissionTracker missions={currentLevel.missions} buildings={buildings.filter(b => b.planetIndex === levelIndex)} />
        </div>

        {/* Building Hotbar */}
        <div className="mt-auto pb-12 w-full flex justify-center">
          <BuildingHotbar 
            onSelect={(type) => { spaceAudio.playSelect(); setInspectingBuilding(type); }} 
            selected={selectedBuildingType} 
            registry={BUILDING_REGISTRY} 
            minerals={minerals}
          />
        </div>
      </div>

      {/* Modals */}
      {showInfo && !selectedBuildingType && !inspectingBuilding && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-96 z-20 pointer-events-auto">
          <CelestialInfoModal planet={currentLevel.planet} onClose={() => { spaceAudio.playSelect(); setShowInfo(false); }} />
        </div>
      )}

      {inspectingBuilding && (
        <BuildingDetailsModal 
          type={inspectingBuilding}
          info={BUILDING_REGISTRY[inspectingBuilding]}
          minerals={minerals}
          previouslyCrafted={buildings.some(b => b.type === inspectingBuilding)}
          onConfirm={() => {
            spaceAudio.playSelect();
            setSelectedBuildingType(inspectingBuilding);
            setInspectingBuilding(null);
            notify("DEPLOYMENT READY: CLICK PLANET SURFACE");
          }}
          onClose={() => { spaceAudio.playSelect(); setInspectingBuilding(null); }}
        />
      )}

      {showAchievements && (
        <AchievementPanel achievements={achievements} onClose={() => { spaceAudio.playSelect(); setShowAchievements(false); }} />
      )}

      {hyperdrive && <WarpOverlay destinationName={availableLevels[levelIndex].planet.name} />}
      
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div className="bg-cyan-500/80 backdrop-blur-md text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest animate-bounce shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-white/20 text-center min-w-[300px]">
            {notification}
          </div>
        </div>
      )}
    </div>
  );
}

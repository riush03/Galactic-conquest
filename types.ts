
export interface PlanetData {
  name: string;
  type: 'Terrestrial' | 'Gas Giant' | 'Ice Giant' | 'Lava' | 'Toxic' | 'Crystal' | 'Arid' | 'Cyber' | 'Ancient';
  baseColor: string;
  atmosphereColor: string;
  radius: number;
  rotationSpeed: number;
  description: string;
  anomalies: string[];
  hasRings: boolean;
  ringColor?: string;
  ringRadiusInner?: number;
  ringRadiusOuter?: number;
  resources: {
    minerals: number;
    energy: number;
    tech: number;
  };
}

export type BuildingCategory = 'colony' | 'station' | 'science';

export type BuildingType = 
  | 'extractor' | 'solar' | 'habitat' | 'lab' | 'drone' | 'rover' | 'flag' | 'plants' // Colony & General
  | 'station_core' | 'station_wing' | 'station_dock' | 'shuttle' // Station
  | 'satellite' | 'telescope' | 'comm_dish'; // Science

export interface Building {
  id: string;
  type: BuildingType;
  category: BuildingCategory;
  position: [number, number, number];
  rotation?: [number, number, number];
  planetIndex: number;
}

export interface ColonyState {
  minerals: number;
  energy: number;
  tech: number;
  buildings: Building[];
}

export type ViewMode = 'system' | 'focus';

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'build';
  requirement: string;
  completed: boolean;
  buildingType?: BuildingType;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (state: { buildings: Building[], minerals: number, visitedPlanets: Set<number> }) => boolean;
  unlocked: boolean;
}

export interface LevelDef {
  index: number;
  planet: PlanetData;
  missions: Mission[];
}

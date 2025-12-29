
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

export type MenuState = 'splash' | 'main' | 'playing';

export type BuildingType = 'extractor' | 'solar' | 'lab' | 'habitat' | 'satellite' | 'drone' | 'plants' | 'rover' | 'shuttle';

export interface Building {
  id: string;
  type: BuildingType;
  position: [number, number, number];
  timestamp: number;
  progress: number;
}

export interface ColonyState {
  isEstablished: boolean;
  minerals: number;
  energy: number;
  tech: number;
  buildings: Building[];
}

export type ViewMode = 'orbit' | 'surface' | 'landing' | 'ascending';

export interface InventoryItem {
  type: BuildingType;
  name: string;
  cost: number;
  icon: string;
  color: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'build' | 'resource_minerals' | 'resource_energy' | 'resource_tech';
  requirement: string;
  completed: boolean;
  buildingType?: BuildingType;
}

export interface LevelDef {
  index: number;
  planet: PlanetData;
  missions: Mission[];
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface FeedMessage {
  id: string;
  sender: 'EARTH CONTROL' | 'COLONY SCIENTIST' | 'SYSTEM';
  text: string;
  timestamp: string;
  type: 'info' | 'urgent' | 'success';
}
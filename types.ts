
export interface PlanetData {
  name: string;
  type: string;
  baseColor: string;
  atmosphereColor: string;
  radius: number;
  rotationSpeed: number;
  description: string;
  anomalies: string[];
  resources: {
    minerals: number;
    energy: number;
    tech: number;
  };
}

export type BuildingType = 'extractor' | 'solar' | 'lab' | 'habitat' | 'satellite' | 'drone';

export interface Resource {
  type: 'energy' | 'minerals' | 'science' | 'data';
  amount: number;
}

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

export type ViewMode = 'orbit' | 'surface' | 'landing';

export interface InventoryItem {
  type: BuildingType;
  name: string;
  cost: number;
  icon: string;
  color: string;
}

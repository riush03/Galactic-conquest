
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

export type BuildingType = 'extractor' | 'solar' | 'lab' | 'habitat';

export interface Building {
  id: string;
  type: BuildingType;
  position: [number, number, number];
}

export interface ColonyState {
  isEstablished: boolean;
  minerals: number;
  energy: number;
  tech: number;
  buildings: Building[];
}

export type ViewMode = 'orbit' | 'surface';

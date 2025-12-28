
export interface PlanetData {
  name: string;
  type: string;
  baseColor: string;
  atmosphereColor: string;
  radius: number;
  rotationSpeed: number;
  description: string;
  anomalies: string[];
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

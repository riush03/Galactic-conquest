
import { PlanetData } from './types';

export const DEFAULT_PLANET: PlanetData = {
  name: "Gia Prime",
  type: "Terrestrial",
  baseColor: "#3b82f6",
  atmosphereColor: "#60a5fa",
  radius: 120,
  rotationSpeed: 0.002,
  description: "A serene oceanic world located in the habitable zone of the Sirius system.",
  anomalies: ["Bioluminescent oceans", "Crystalline rain"]
};

export const STAR_COUNT = 400;
export const MAX_STAR_SPEED = 0.5;

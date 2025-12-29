
import { PlanetData, LevelDef } from './types';

export const LEVELS: LevelDef[] = [
  {
    index: 1,
    planet: {
      name: "Gia Prime",
      type: "Terrestrial",
      baseColor: "#3b82f6",
      atmosphereColor: "#60a5fa",
      radius: 120,
      rotationSpeed: 0.002,
      description: "A serene oceanic world. The perfect place to start our colonial expansion.",
      anomalies: ["Bioluminescent oceans"],
      hasRings: false,
      resources: { minerals: 5, energy: 8, tech: 4 }
    },
    missions: [
      { id: 'l1m1', title: 'Power Start', description: 'Deploy 2 Solar Arrays.', target: 2, current: 0, type: 'build', buildingType: 'solar', requirement: 'Solar Panels', completed: false },
      { id: 'l1m2', title: 'Resource Hub', description: 'Build 1 Extractor.', target: 1, current: 0, type: 'build', buildingType: 'extractor', requirement: 'Extractor', completed: false }
    ]
  },
  {
    index: 2,
    planet: {
      name: "Zyon-4",
      type: "Arid",
      baseColor: "#f59e0b",
      atmosphereColor: "#fbbf24",
      radius: 100,
      rotationSpeed: 0.004,
      description: "A dusty desert world with high mineral concentrations but scarce water.",
      anomalies: ["Glass storms"],
      hasRings: true,
      ringColor: "#d97706",
      resources: { minerals: 9, energy: 4, tech: 3 }
    },
    missions: [
      { id: 'l2m1', title: 'Dust Settlement', description: 'Deploy 3 Habitats.', target: 3, current: 0, type: 'build', buildingType: 'habitat', requirement: 'Colony Pods', completed: false },
      { id: 'l2m2', title: 'Mining Op', description: 'Deploy 2 Extractors.', target: 2, current: 0, type: 'build', buildingType: 'extractor', requirement: 'Extractors', completed: false }
    ]
  },
  {
    index: 3,
    planet: {
      name: "Ignis Delta",
      type: "Lava",
      baseColor: "#ef4444",
      atmosphereColor: "#f87171",
      radius: 140,
      rotationSpeed: 0.001,
      description: "A volatile volcanic world. Extremely hazardous, but rich in thermal energy.",
      anomalies: ["Magma rivers"],
      hasRings: false,
      resources: { minerals: 10, energy: 10, tech: 2 }
    },
    missions: [
      { id: 'l3m1', title: 'Thermal Harvest', description: 'Reach 25,000 Minerals.', target: 25000, current: 0, type: 'resource_minerals', requirement: 'Stored Minerals', completed: false },
      { id: 'l3m2', title: 'Research Base', description: 'Build 1 Science Lab.', target: 1, current: 0, type: 'build', buildingType: 'lab', requirement: 'Science Lab', completed: false }
    ]
  },
  {
    index: 4,
    planet: {
      name: "Glacies VII",
      type: "Ice Giant",
      baseColor: "#60a5fa",
      atmosphereColor: "#dbeafe",
      radius: 180,
      rotationSpeed: 0.006,
      description: "A frozen giant. Solar energy is weak here due to distance from the sun.",
      anomalies: ["Absolute zero pockets"],
      hasRings: true,
      ringColor: "#ffffff",
      resources: { minerals: 3, energy: 2, tech: 9 }
    },
    missions: [
      { id: 'l4m1', title: 'Energy Grid', description: 'Deploy 6 Solar Arrays.', target: 6, current: 0, type: 'build', buildingType: 'solar', requirement: 'Solar Arrays', completed: false },
      { id: 'l4m2', title: 'Cold Science', description: 'Build 2 Science Labs.', target: 2, current: 0, type: 'build', buildingType: 'lab', requirement: 'Science Labs', completed: false }
    ]
  },
  {
    index: 5,
    planet: {
      name: "Venoma",
      type: "Toxic",
      baseColor: "#10b981",
      atmosphereColor: "#34d399",
      radius: 110,
      rotationSpeed: 0.003,
      description: "The atmosphere is corrosive. Organic life requires heavy shielding.",
      anomalies: ["Acid rain"],
      hasRings: false,
      resources: { minerals: 6, energy: 7, tech: 6 }
    },
    missions: [
      { id: 'l5m1', title: 'Life Support', description: 'Build 3 Biodomes.', target: 3, current: 0, type: 'build', buildingType: 'plants', requirement: 'Biodomes', completed: false },
      { id: 'l5m2', title: 'Satellite Uplink', description: 'Deploy 1 Satellite.', target: 1, current: 0, type: 'build', buildingType: 'satellite', requirement: 'Satellite', completed: false }
    ]
  },
  {
    index: 6,
    planet: {
      name: "Krystalos",
      type: "Crystal",
      baseColor: "#a855f7",
      atmosphereColor: "#c084fc",
      radius: 90,
      rotationSpeed: 0.008,
      description: "A world composed entirely of resonating crystals. High tech potential.",
      anomalies: ["Harmonic vibrations"],
      hasRings: false,
      resources: { minerals: 5, energy: 5, tech: 10 }
    },
    missions: [
      { id: 'l6m1', title: 'Tech Peak', description: 'Reach 5,000 Tech Points.', target: 5000, current: 0, type: 'resource_tech', requirement: 'Tech Points', completed: false },
      { id: 'l6m2', title: 'Sky Eye', description: 'Deploy 3 Satellites.', target: 3, current: 0, type: 'build', buildingType: 'satellite', requirement: 'Satellites', completed: false }
    ]
  },
  {
    index: 7,
    planet: {
      name: "Neon Oasis",
      type: "Cyber",
      baseColor: "#ec4899",
      atmosphereColor: "#f472b6",
      radius: 130,
      rotationSpeed: 0.01,
      description: "A world with strange electromagnetic neon clouds. High energy flux.",
      anomalies: ["Digital mirages"],
      hasRings: true,
      ringColor: "#ff00ff",
      resources: { minerals: 4, energy: 10, tech: 8 }
    },
    missions: [
      { id: 'l7m1', title: 'Power Surge', description: 'Reach 10,000 Energy.', target: 10000, current: 0, type: 'resource_energy', requirement: 'Stored Energy', completed: false },
      { id: 'l7m2', title: 'Drone Net', description: 'Deploy 4 Drones.', target: 4, current: 0, type: 'build', buildingType: 'drone', requirement: 'Drones', completed: false }
    ]
  },
  {
    index: 8,
    planet: {
      name: "Obsidian",
      type: "Lava",
      baseColor: "#111827",
      atmosphereColor: "#374151",
      radius: 150,
      rotationSpeed: 0.002,
      description: "A dark, cooled lava world. Ground visibility is low.",
      anomalies: ["Shadow pockets"],
      hasRings: false,
      resources: { minerals: 8, energy: 3, tech: 5 }
    },
    missions: [
      { id: 'l8m1', title: 'Scout Squad', description: 'Build 4 Rovers.', target: 4, current: 0, type: 'build', buildingType: 'rover', requirement: 'Rovers', completed: false },
      { id: 'l8m2', title: 'Heavy Hab', description: 'Build 5 Colony Pods.', target: 5, current: 0, type: 'build', buildingType: 'habitat', requirement: 'Colony Pods', completed: false }
    ]
  },
  {
    index: 9,
    planet: {
      name: "Zenith",
      type: "Ancient",
      baseColor: "#ffffff",
      atmosphereColor: "#f0f9ff",
      radius: 200,
      rotationSpeed: 0.001,
      description: "The final frontier. Artifacts of an ancient civilization are scattered here.",
      anomalies: ["Time dilation zones"],
      hasRings: true,
      ringColor: "#e0f2fe",
      resources: { minerals: 10, energy: 10, tech: 10 }
    },
    missions: [
      { id: 'l9m1', title: 'Master Colony', description: 'Build 1 of every module type.', target: 9, current: 0, type: 'build', requirement: 'Unique Modules', completed: false },
      { id: 'l9m2', title: 'Ultimate Resource', description: 'Reach 100,000 Minerals.', target: 100000, current: 0, type: 'resource_minerals', requirement: 'Minerals', completed: false }
    ]
  }
];

export const DEFAULT_PLANET: PlanetData = LEVELS[0].planet;
export const STAR_COUNT = 2000;
export const MAX_STAR_SPEED = 5;


import { LevelDef, Achievement } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Establish your first building in the solar system.',
    icon: 'fa-shoe-prints',
    condition: (s) => s.buildings.length >= 1,
    unlocked: false
  },
  {
    id: 'planet_hopper',
    title: 'Planet Hopper',
    description: 'Visit at least 3 unique celestial bodies.',
    icon: 'fa-shuttle-space',
    condition: (s) => s.visitedPlanets.size >= 3,
    unlocked: false
  },
  {
    id: 'solar_empire',
    title: 'Solar Empire',
    description: 'Maintain 5 active buildings across the system.',
    icon: 'fa-chess-rook',
    condition: (s) => s.buildings.length >= 5,
    unlocked: false
  },
  {
    id: 'industrialist',
    title: 'Industrialist',
    description: 'Reach a treasury of 500 credits.',
    icon: 'fa-vault',
    condition: (s) => s.minerals >= 500,
    unlocked: false
  },
  {
    id: 'xenobiologist',
    title: 'Xenobiologist',
    description: 'Deploy 2 Research Labs on a gas giant or toxic world.',
    icon: 'fa-microscope',
    condition: (s) => s.buildings.filter(b => b.type === 'lab').length >= 2,
    unlocked: false
  },
  {
    id: 'master_navigator',
    title: 'Master Navigator',
    description: 'Visit all 9 major celestial bodies.',
    icon: 'fa-compass',
    condition: (s) => s.visitedPlanets.size >= 9,
    unlocked: false
  }
];

export const LEVELS: LevelDef[] = [
  {
    index: 0,
    planet: {
      name: "The Sun",
      type: "Ancient",
      baseColor: "#ffcc00",
      atmosphereColor: "#ffaa00",
      radius: 1000,
      rotationSpeed: 0.0005,
      description: "A G-type main-sequence star. It contains 99.86% of the mass in the Solar System and generates energy through nuclear fusion.",
      anomalies: ["Solar Flare Activity", "Neutrino Emission", "Convection Zone"],
      hasRings: false,
      resources: { minerals: 0, energy: 100, tech: 50 }
    },
    missions: [
      { id: "s1", title: "Helio-Station", description: "Deploy a station in high orbit to monitor flares.", target: 1, current: 0, type: 'build', requirement: "1 Station Core", completed: false, buildingType: 'station_core' },
      { id: "s2", title: "Solar Array Alpha", description: "Capture massive energy output.", target: 3, current: 0, type: 'build', requirement: "3 Solar Arrays", completed: false, buildingType: 'solar' }
    ]
  },
  {
    index: 1,
    planet: {
      name: "Mercury",
      type: "Arid",
      baseColor: "#4a4a4a",
      atmosphereColor: "#ffffff",
      radius: 40,
      rotationSpeed: 0.001,
      description: "The smallest planet. Heavily cratered and scorched by the Sun, it has a massive iron core.",
      anomalies: ["Caloris Basin", "Magnetic Reconnection", "Ice in Shadows"],
      hasRings: false,
      resources: { minerals: 15, energy: 20, tech: 5 }
    },
    missions: [
      { id: "m1", title: "Iron Extraction", description: "Establish mineral mining operations.", target: 2, current: 0, type: 'build', requirement: "2 Extractors", completed: false, buildingType: 'extractor' },
      { id: "m2", title: "Surface Survey", description: "Deploy rovers to scan craters.", target: 3, current: 0, type: 'build', requirement: "3 Rovers", completed: false, buildingType: 'rover' }
    ]
  },
  {
    index: 2,
    planet: {
      name: "Venus",
      type: "Toxic",
      baseColor: "#e3bb76",
      atmosphereColor: "#ffcc00",
      radius: 95,
      rotationSpeed: -0.0005,
      description: "Earth's twin in size, but a hellscape of thick sulfuric acid clouds and extreme surface pressure.",
      anomalies: ["Retrograde rotation", "Lightning Storms", "Maat Mons Volcano"],
      hasRings: false,
      resources: { minerals: 8, energy: 30, tech: 8 }
    },
    missions: [
      { id: "v1", title: "Atmosphere Lab", description: "Study the runaway greenhouse effect.", target: 1, current: 0, type: 'build', requirement: "1 Research Lab", completed: false, buildingType: 'lab' },
      { id: "v2", title: "Hardened Drones", description: "Monitor the crushing surface pressure.", target: 4, current: 0, type: 'build', requirement: "4 Maintenance Drones", completed: false, buildingType: 'drone' }
    ]
  },
  {
    index: 3,
    planet: {
      name: "Earth",
      type: "Terrestrial",
      baseColor: "#1e40af",
      atmosphereColor: "#60a5fa",
      radius: 100,
      rotationSpeed: 0.001,
      description: "Our cradle. A vibrant world of liquid water, oxygen, and life protected by a magnetosphere.",
      anomalies: ["Technosphere", "Dynamic Biosphere", "Tidal Lock"],
      hasRings: false,
      resources: { minerals: 10, energy: 10, tech: 15 }
    },
    missions: [
      { id: "e1", title: "Orbital Relay", description: "Ensure global communication coverage.", target: 3, current: 0, type: 'build', requirement: "3 Comms Satellites", completed: false, buildingType: 'satellite' },
      { id: "e2", title: "Coastal Colony", description: "Establish a new habitat node.", target: 2, current: 0, type: 'build', requirement: "2 Habitat Pods", completed: false, buildingType: 'habitat' }
    ]
  },
  {
    index: 4,
    planet: {
      name: "Mars",
      type: "Arid",
      baseColor: "#991b1b",
      atmosphereColor: "#f87171",
      radius: 53,
      rotationSpeed: 0.002,
      description: "The Red Planet. Host to Olympus Mons, the largest volcano in the Solar System.",
      anomalies: ["Olympus Mons", "Valles Marineris", "Subsurface Water"],
      hasRings: false,
      resources: { minerals: 12, energy: 15, tech: 18 }
    },
    missions: [
      { id: "ma1", title: "Bio-Dome Beta", description: "Start the terraforming process with plants.", target: 3, current: 0, type: 'build', requirement: "3 Bio-Domes", completed: false, buildingType: 'plants' },
      { id: "ma2", title: "Rover Fleet", description: "Map the Valles Marineris canyon.", target: 5, current: 0, type: 'build', requirement: "5 Surface Rovers", completed: false, buildingType: 'rover' }
    ]
  },
  {
    index: 5,
    planet: {
      name: "Jupiter",
      type: "Gas Giant",
      baseColor: "#92400e",
      atmosphereColor: "#f59e0b",
      radius: 220,
      rotationSpeed: 0.005,
      description: "King of planets. A gas giant with 79 moons and a storm twice the size of Earth.",
      anomalies: ["Great Red Spot", "Strong Magnetosphere", "Metallic Core"],
      hasRings: false,
      resources: { minerals: 5, energy: 40, tech: 25 }
    },
    missions: [
      { id: "j1", title: "Storm Watch", description: "Deploy labs to monitor the Great Red Spot.", target: 2, current: 0, type: 'build', requirement: "2 Research Labs", completed: false, buildingType: 'lab' },
      { id: "j2", title: "Gas Harvester", description: "Extract hydrogen from the upper atmosphere.", target: 3, current: 0, type: 'build', requirement: "3 Extractors", completed: false, buildingType: 'extractor' }
    ]
  },
  {
    index: 6,
    planet: {
      name: "Saturn",
      type: "Gas Giant",
      baseColor: "#d97706",
      atmosphereColor: "#fbbf24",
      radius: 190,
      rotationSpeed: 0.004,
      description: "Famous for its stunning ring system, composed of ice and rock particles spanning 282,000 km.",
      anomalies: ["Hexagonal Storm", "Enceladus Plumes", "Ring Gaps"],
      hasRings: true,
      ringColor: "#d97706",
      ringRadiusInner: 1.8,
      ringRadiusOuter: 4.5,
      resources: { minerals: 8, energy: 35, tech: 22 }
    },
    missions: [
      { id: "sa1", title: "Ring Station", description: "Build a dock for deep space transit.", target: 1, current: 0, type: 'build', requirement: "1 Docking Bay", completed: false, buildingType: 'station_dock' },
      { id: "sa2", title: "Debris Collector", description: "Study the composition of the rings.", target: 4, current: 0, type: 'build', requirement: "4 Maintenance Drones", completed: false, buildingType: 'drone' }
    ]
  },
  {
    index: 7,
    planet: {
      name: "Uranus",
      type: "Ice Giant",
      baseColor: "#0ea5e9",
      atmosphereColor: "#bae6fd",
      radius: 120,
      rotationSpeed: -0.003,
      description: "An ice giant tilted on its side, likely due to a massive ancient collision.",
      anomalies: ["Extreme Tilt", "Diamond Rain", "Faint Rings"],
      hasRings: true,
      ringColor: "#ffffff",
      ringRadiusInner: 1.5,
      ringRadiusOuter: 2.2,
      resources: { minerals: 15, energy: 15, tech: 30 }
    },
    missions: [
      { id: "u1", title: "Deep Probe", description: "Search for liquid diamond oceans.", target: 2, current: 0, type: 'build', requirement: "2 Extractors", completed: false, buildingType: 'extractor' },
      { id: "u2", title: "Telescope Array", description: "Use the dark sky for deep space imaging.", target: 2, current: 0, type: 'build', requirement: "2 Array Telescopes", completed: false, buildingType: 'telescope' }
    ]
  },
  {
    index: 8,
    planet: {
      name: "Neptune",
      type: "Ice Giant",
      baseColor: "#1e3a8a",
      atmosphereColor: "#3b82f6",
      radius: 115,
      rotationSpeed: 0.0035,
      description: "The windy planet. Farthest from the Sun, with supersonic winds reaching 2,100 km/h.",
      anomalies: ["Supersonic Winds", "Great Dark Spot", "Triton Capture"],
      hasRings: true,
      ringColor: "#3b82f6",
      ringRadiusInner: 1.4,
      ringRadiusOuter: 1.8,
      resources: { minerals: 12, energy: 10, tech: 35 }
    },
    missions: [
      { id: "n1", title: "Wind Farm", description: "Harness supersonic energy.", target: 4, current: 0, type: 'build', requirement: "4 Solar Arrays", completed: false, buildingType: 'solar' },
      { id: "n2", title: "Comms Hub", description: "Relay signals from beyond the heliopause.", target: 1, current: 0, type: 'build', requirement: "1 Signal Dish", completed: false, buildingType: 'comm_dish' }
    ]
  }
];

export const STAR_COUNT = 8000;


import { GoogleGenAI, Type } from "@google/genai";
import { PlanetData, Mission } from "../types";

export interface AIPlanetResponse {
  planet: PlanetData;
  missions: Mission[];
}

export const generateNewPlanet = async (): Promise<AIPlanetResponse> => {
  const destinations = await generatePlanetDestinations(1);
  return destinations[0];
};

export const generatePlanetDestinations = async (count: number = 3): Promise<AIPlanetResponse[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} scientifically distinct and visually stunning fictional planets for a high-fidelity 3D space simulation.
      
      Visual Archetypes for rendering:
      - 'Gas Giant': High-mass planet with a thick, multi-colored banded atmosphere (like Jupiter). Often has storms or spots.
      - 'Terrestrial': Earth-like world featuring continents, liquid oceans, and swirling cloud layers.
      - 'Lava': Black basaltic crust shattered by incandescent red/orange cracks and rivers of molten rock.
      - 'Toxic': Thick yellowish-green haze, highly acidic atmosphere, and rugged, corrosive rocky outcrops.
      - 'Ice Giant': Smooth cyan or deep blue gradients (like Uranus/Neptune) with faint, high-altitude white wisps.
      - 'Crystal': A planet with translucent geometric surfaces and vibrant fuchsia/purple crystalline formations.
      - 'Arid': Rusty red/brown desert surfaces with massive canyons, mountains, and impact craters.
      - 'Cyber': Dark metallic surface with glowing neon grid lines, circuit-like patterns, and monolithic mega-structures.
      - 'Ancient': Gray and gold cracked surface with massive monolithic ruins and remnants of a past civilization.

      For each planet, generate 2-3 specific 'build' missions that relate to its unique biology, geology, or environment. 
      Use building types: 'extractor', 'solar', 'habitat', 'lab', 'satellite', 'shuttle', 'drone', 'rover', 'plants', 'telescope', 'comm_dish', 'station_core'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              planet: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Terrestrial", "Gas Giant", "Ice Giant", "Lava", "Toxic", "Crystal", "Arid", "Cyber", "Ancient"] },
                  baseColor: { type: Type.STRING, description: "Primary surface hex color" },
                  atmosphereColor: { type: Type.STRING, description: "Secondary glow/atmosphere hex color" },
                  radius: { type: Type.NUMBER, description: "Relative size 40 to 220" },
                  rotationSpeed: { type: Type.NUMBER, description: "0.001 to 0.005" },
                  description: { type: Type.STRING },
                  anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  hasRings: { type: Type.BOOLEAN },
                  ringColor: { type: Type.STRING },
                  ringRadiusInner: { type: Type.NUMBER, description: "Inner ring radius multiplier (1.2 to 2.0)" },
                  ringRadiusOuter: { type: Type.NUMBER, description: "Outer ring radius multiplier (2.5 to 4.5)" },
                  resources: {
                    type: Type.OBJECT,
                    properties: {
                      minerals: { type: Type.INTEGER, description: "1-10 density" },
                      energy: { type: Type.INTEGER, description: "1-10 potential" },
                      tech: { type: Type.INTEGER, description: "1-10 difficulty" }
                    },
                    required: ["minerals", "energy", "tech"]
                  }
                },
                required: ["name", "type", "baseColor", "atmosphereColor", "radius", "rotationSpeed", "description", "anomalies", "hasRings", "resources"]
              },
              missions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    target: { type: Type.INTEGER },
                    type: { type: Type.STRING, enum: ["build"] },
                    requirement: { type: Type.STRING },
                    buildingType: { type: Type.STRING }
                  },
                  required: ["id", "title", "description", "target", "type", "requirement", "buildingType"]
                }
              }
            },
            required: ["planet", "missions"]
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    return data as AIPlanetResponse[];
  } catch (error) {
    console.error("Error generating planets:", error);
    const def = (await import('../constants')).LEVELS[3];
    return [{ planet: def.planet, missions: def.missions }];
  }
};

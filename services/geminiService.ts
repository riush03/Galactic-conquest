
import { GoogleGenAI, Type } from "@google/genai";
import { PlanetData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNewPlanet = async (): Promise<PlanetData> => {
  const destinations = await generatePlanetDestinations(1);
  return destinations[0];
};

export const generatePlanetDestinations = async (count: number = 3): Promise<PlanetData[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of ${count} unique fictional planets for a space exploration game. 
      Vary the types: Terrestrial, Gas Giant, Ice Giant, Lava, Toxic. 
      Ensure variety in appearances (colors, rings). 
      Make them distinct in resources.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { 
                type: Type.STRING, 
                description: "One of: Terrestrial, Gas Giant, Ice Giant, Lava, Toxic" 
              },
              baseColor: { type: Type.STRING, description: "Hex color code for the main body" },
              atmosphereColor: { type: Type.STRING, description: "Hex color code for the atmosphere" },
              radius: { type: Type.NUMBER, description: "80-200" },
              rotationSpeed: { type: Type.NUMBER, description: "0.001-0.01" },
              description: { type: Type.STRING },
              anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
              hasRings: { type: Type.BOOLEAN },
              ringColor: { type: Type.STRING, description: "Hex color for rings, if applicable" },
              ringRadiusInner: { type: Type.NUMBER, description: "Inner ring radius multiplier (1.2 - 1.5), if applicable" },
              ringRadiusOuter: { type: Type.NUMBER, description: "Outer ring radius multiplier (1.8 - 2.5), if applicable" },
              resources: {
                type: Type.OBJECT,
                properties: {
                  minerals: { type: Type.INTEGER, description: "1-10" },
                  energy: { type: Type.INTEGER, description: "1-10" },
                  tech: { type: Type.INTEGER, description: "1-10" }
                },
                required: ["minerals", "energy", "tech"]
              }
            },
            required: ["name", "type", "baseColor", "atmosphereColor", "radius", "rotationSpeed", "description", "anomalies", "hasRings", "resources"]
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    return data as PlanetData[];
  } catch (error) {
    console.error("Error generating planets:", error);
    const def = (await import('../constants')).DEFAULT_PLANET;
    return [def, { ...def, name: "Gia Beta" }, { ...def, name: "Gia Gamma" }];
  }
};

export const generateScientificLog = async (planet: PlanetData, buildings: any[], minerals: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a scientist on the planet ${planet.name}. 
      The planet is a ${planet.type} type world.
      Current colony has: ${buildings.length} modules deployed.
      Resources stored: ${Math.floor(minerals)} minerals.
      Write a short, professional, and slightly excited 2-sentence status update log to Earth Control about our progress.`,
    });
    return response.text || "Status nominal. Expansion proceeding as planned.";
  } catch (error) {
    return "Atmospheric interference detected. Signal weak, but colony remains stable.";
  }
};

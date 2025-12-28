
import { GoogleGenAI, Type } from "@google/genai";
import { PlanetData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNewPlanet = async (): Promise<PlanetData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate details for a unique fictional planet for a space strategy game. Include resource potential for mining, solar energy, and scientific research.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            baseColor: { type: Type.STRING, description: "Hex color code" },
            atmosphereColor: { type: Type.STRING, description: "Hex color code" },
            radius: { type: Type.NUMBER, description: "80-200" },
            rotationSpeed: { type: Type.NUMBER, description: "0.001-0.01" },
            description: { type: Type.STRING },
            anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
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
          required: ["name", "type", "baseColor", "atmosphereColor", "radius", "rotationSpeed", "description", "anomalies", "resources"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data as PlanetData;
  } catch (error) {
    console.error("Error generating planet:", error);
    return (await import('../constants')).DEFAULT_PLANET;
  }
};

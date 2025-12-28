
import { GoogleGenAI, Type } from "@google/genai";
import { PlanetData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNewPlanet = async (): Promise<PlanetData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate details for a unique fictional planet in the universe.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            baseColor: { type: Type.STRING, description: "A hex color code for the planet surface" },
            atmosphereColor: { type: Type.STRING, description: "A hex color code for the atmosphere" },
            radius: { type: Type.NUMBER, description: "Radius value between 80 and 200" },
            rotationSpeed: { type: Type.NUMBER, description: "Rotation speed between 0.001 and 0.01" },
            description: { type: Type.STRING },
            anomalies: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["name", "type", "baseColor", "atmosphereColor", "radius", "rotationSpeed", "description", "anomalies"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data as PlanetData;
  } catch (error) {
    console.error("Error generating planet:", error);
    throw error;
  }
};

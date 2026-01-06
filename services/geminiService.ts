
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAnimeInsight = async (animeTitle: string, genres: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Describe why an anime fan would love "${animeTitle}" (genres: ${genres.join(', ')}). Keep it to 3 exciting sentences.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini failed:", error);
    return null;
  }
};

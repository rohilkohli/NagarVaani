import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Returns a configured gemini-3.7-flash model helper / caller
 */
export function getGeminiModel(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  return {
    name: "gemini-3.7-flash",
    ai,
    async generateContent(contents: any, config?: any) {
      return await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config,
      });
    }
  };
}

export default getGeminiModel;

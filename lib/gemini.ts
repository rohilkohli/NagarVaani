import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const KNOWN_GOOD_GEMINI_MODEL = "gemini-2.5-flash";

let aiClient: GoogleGenAI | null = null;

let resolvedModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

export function getGeminiModelName(): string {
  return resolvedModel;
}

export function chooseGeminiModel(configured: string, available: string[]): { model: string; usedFallback: boolean } {
  const names = new Set(available.map((name) => name.replace(/^models\//, "")));
  if (names.has(configured)) return { model: configured, usedFallback: false };
  const preferred = [DEFAULT_GEMINI_MODEL, KNOWN_GOOD_GEMINI_MODEL].find((name) => names.has(name));
  if (preferred) return { model: preferred, usedFallback: true };
  const flashModel = available.map((name) => name.replace(/^models\//, "")).find((name) => /flash/i.test(name));
  return { model: flashModel || KNOWN_GOOD_GEMINI_MODEL, usedFallback: true };
}

export async function initializeGeminiModel(): Promise<string> {
  const configured = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    resolvedModel = configured;
    console.warn(`Gemini model discovery skipped because GEMINI_API_KEY is missing; using ${resolvedModel}.`);
    return resolvedModel;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const available: string[] = [];
    const models = await ai.models.list() as unknown as AsyncIterable<{ name?: string }>;
    for await (const model of models) {
      if (model.name) available.push(model.name);
    }
    const selection = chooseGeminiModel(configured, available);
    resolvedModel = selection.model;
    if (selection.usedFallback) {
      console.warn(`Configured Gemini model ${configured} is unavailable; using ${resolvedModel}.`);
    } else {
      console.log(`Configured Gemini model ${resolvedModel} is available.`);
    }
  } catch (error) {
    resolvedModel = KNOWN_GOOD_GEMINI_MODEL;
    console.warn(`Gemini model discovery failed; using ${resolvedModel}.`, error instanceof Error ? error.message : error);
  }
  return resolvedModel;
}

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
 * Returns a configured Gemini Flash model helper / caller.
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
    name: getGeminiModelName(),
    ai,
    async generateContent(contents: any, config?: any) {
      return await ai.models.generateContent({
        model: getGeminiModelName(),
        contents,
        config,
      });
    }
  };
}

export default getGeminiModel;

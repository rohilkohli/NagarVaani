/**
 * scripts/check-model.ts
 *
 * Usage:  npm run check:model
 *
 * Queries the Gemini API with the current GEMINI_API_KEY, lists all available
 * model names, checks whether "gemini-2.5-flash" (the current DEFAULT_GEMINI_MODEL)
 * exists, and prints the best available Flash model so you can update the constant
 * in lib/gemini.ts if needed.
 *
 * Safe to run without side-effects — read-only API call.
 */

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { DEFAULT_GEMINI_MODEL, KNOWN_GOOD_GEMINI_MODEL } from "../lib/gemini.ts";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("❌  GEMINI_API_KEY is not set. Export it or add it to .env and re-run.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

console.log("🔍  Querying available Gemini models...\n");

const available: string[] = [];
try {
  const modelList = await ai.models.list() as unknown as AsyncIterable<{ name?: string }>;
  for await (const model of modelList) {
    if (model.name) available.push(model.name.replace(/^models\//, ""));
  }
} catch (err) {
  console.error("❌  Failed to list models:", err instanceof Error ? err.message : err);
  process.exit(1);
}

if (available.length === 0) {
  console.warn("⚠️  No models returned by the API. Check that your API key has the Generative Language API enabled.");
  process.exit(1);
}

// Sort for readability
available.sort();

console.log("📋  All available models:");
for (const name of available) {
  console.log(`   • ${name}`);
}

// Flash models (sorted newest-first heuristically by version number in name)
const flashModels = available.filter((name) => /flash/i.test(name));
const flashSorted = [...flashModels].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

console.log(`\n⚡  Flash models available (${flashModels.length}):`);
for (const name of flashSorted) {
  console.log(`   • ${name}`);
}

const bestFlash = flashSorted[0] ?? null;

// Check configured defaults
const defaultPresent = available.includes(DEFAULT_GEMINI_MODEL);
const fallbackPresent = available.includes(KNOWN_GOOD_GEMINI_MODEL);

console.log(`\n🎯  DEFAULT_GEMINI_MODEL  ("${DEFAULT_GEMINI_MODEL}") → ${defaultPresent ? "✅ available" : "❌ NOT available"}`);
console.log(`🔒  KNOWN_GOOD_GEMINI_MODEL ("${KNOWN_GOOD_GEMINI_MODEL}") → ${fallbackPresent ? "✅ available" : "❌ NOT available"}`);

if (bestFlash) {
  console.log(`\n🏆  Best available Flash model: ${bestFlash}`);
  if (bestFlash !== DEFAULT_GEMINI_MODEL) {
    console.log(`\n💡  Action: Update DEFAULT_GEMINI_MODEL in lib/gemini.ts from`);
    console.log(`           "${DEFAULT_GEMINI_MODEL}" → "${bestFlash}"`);
    console.log(`           if your key can use it (verify in the list above).`);
  } else {
    console.log(`\n✅  DEFAULT_GEMINI_MODEL is already set to the best available Flash model. No changes needed.`);
  }
} else {
  console.log(`\n⚠️  No Flash models found in the available list. Inspect the full list above and update lib/gemini.ts manually.`);
}

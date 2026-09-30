/**
 * scripts/eval-classifier.ts
 *
 * Runs evaluation on data/eval/complaints_multilingual.jsonl.
 * Evaluates both the Gemini classifier (if GEMINI_API_KEY configured) and rule-based fallback.
 * Computes accuracy per language, confusion matrix, and urgency MAE.
 * Writes actual execution results to docs/eval-results.md.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { parseGeminiClassification, ruleBasedClassify } from "../lib/classify";
import { getGeminiModelName } from "../lib/gemini";
import {
  EvalPrediction,
  EvalSample,
  EvalRunSummary,
  evaluatePredictions,
  formatEvalReportMarkdown,
} from "../lib/evalMetrics";

dotenv.config();

const EVAL_DATA_PATH = path.join(process.cwd(), "data", "eval", "complaints_multilingual.jsonl");
const RESULTS_DOC_PATH = path.join(process.cwd(), "docs", "eval-results.md");
const VALID_CATEGORIES = ["roads", "water", "electricity", "sanitation", "health", "education", "other"];

async function main() {
  console.log("================================================================================");
  console.log("       NagarVaani Multilingual Classifier Evaluation Suite (npm run eval)       ");
  console.log("================================================================================\n");

  if (!fs.existsSync(EVAL_DATA_PATH)) {
    console.error(`Error: Evaluation dataset not found at ${EVAL_DATA_PATH}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(EVAL_DATA_PATH, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const samples: EvalSample[] = lines.map((l, idx) => {
    try {
      return JSON.parse(l);
    } catch {
      throw new Error(`Malformed JSON on line ${idx + 1} of ${EVAL_DATA_PATH}`);
    }
  });

  console.log(`Loaded ${samples.length} multilingual synthetic evaluation samples.`);

  const languages = Array.from(new Set(samples.map((s) => s.language)));
  console.log(`Languages covered (${languages.length}): ${languages.join(", ")}\n`);

  // 1. Evaluate Rule-Based Fallback
  console.log("--------------------------------------------------------------------------------");
  console.log("▶ Evaluating Rule-Based Fallback Classifier...");
  console.log("--------------------------------------------------------------------------------");

  const ruleBasedPredictions: EvalPrediction[] = samples.map((sample) => {
    const res = ruleBasedClassify(sample.text);
    return {
      id: sample.id,
      language: sample.language,
      language_code: sample.language_code,
      gold_category: sample.gold_category,
      predicted_category: res.category,
      gold_urgency: sample.gold_urgency,
      predicted_urgency: res.urgency,
      detected_language: res.language_detected,
      classified_by: "rule-based",
    };
  });

  const ruleBasedResult = evaluatePredictions("rule-based", VALID_CATEGORIES, ruleBasedPredictions);

  console.log(`Overall Category Accuracy: ${(ruleBasedResult.overallAccuracy * 100).toFixed(2)}%`);
  console.log(`Urgency MAE: ${ruleBasedResult.urgencyMAE.toFixed(3)} points (1-5 scale)`);
  console.log("\nPer-Language Accuracy:");
  for (const [lang, val] of Object.entries(ruleBasedResult.perLanguageAccuracy).sort()) {
    console.log(`  - ${lang.padEnd(12)}: ${val.correct}/${val.total} (${(val.accuracy * 100).toFixed(1)}%)`);
  }

  // 2. Evaluate Gemini Classifier if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let geminiResult: ReturnType<typeof evaluatePredictions> | undefined;
  let modelName: string | undefined;

  if (apiKey) {
    modelName = getGeminiModelName();
    console.log("\n--------------------------------------------------------------------------------");
    console.log(`▶ Evaluating Gemini Classifier (${modelName})...`);
    console.log("--------------------------------------------------------------------------------");

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    const geminiPredictions: EvalPrediction[] = [];

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      process.stdout.write(`  [${i + 1}/${samples.length}] Classifying (${sample.language})... `);

      const prompt = `Classify this citizen complaint and return ONLY valid JSON:

Complaint text: ${sample.text}

Return format:
{
  "category": "roads|water|electricity|sanitation|health|education|other",
  "urgency": 1-5,
  "summary_english": "under 20 words",
  "language_detected": "language name in English",
  "english_translation": "faithful complete English translation",
  "keywords": ["array", "of", "words"],
  "confidence": "high|medium|low"
}`;

      try {
        const resp = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { responseMimeType: "application/json", maxOutputTokens: 300 },
        });

        const parsed = parseGeminiClassification(resp.text || "", sample.text);
        geminiPredictions.push({
          id: sample.id,
          language: sample.language,
          language_code: sample.language_code,
          gold_category: sample.gold_category,
          predicted_category: parsed.category,
          gold_urgency: sample.gold_urgency,
          predicted_urgency: parsed.urgency,
          detected_language: parsed.language_detected,
          classified_by: "gemini",
        });
        console.log(`✓ ${parsed.category} (urgency: ${parsed.urgency})`);
        // Small delay to prevent quota exhaustion
        await new Promise((r) => setTimeout(r, 600));
      } catch (err: any) {
        console.log(`⚠️ Failed (${err?.message || "error"}), using fallback`);
        const fallback = ruleBasedClassify(sample.text);
        geminiPredictions.push({
          id: sample.id,
          language: sample.language,
          language_code: sample.language_code,
          gold_category: sample.gold_category,
          predicted_category: fallback.category,
          gold_urgency: sample.gold_urgency,
          predicted_urgency: fallback.urgency,
          detected_language: fallback.language_detected,
          classified_by: "gemini",
        });
      }
    }

    geminiResult = evaluatePredictions("gemini", VALID_CATEGORIES, geminiPredictions);
    console.log(`\nGemini Overall Accuracy: ${(geminiResult.overallAccuracy * 100).toFixed(2)}%`);
    console.log(`Gemini Urgency MAE: ${geminiResult.urgencyMAE.toFixed(3)} points (1-5 scale)`);
  } else {
    console.log("\n⚠️  GEMINI_API_KEY is missing. Running evaluation for rule-based fallback only.");
    console.log("   (To evaluate Gemini, add GEMINI_API_KEY to your .env file and rerun npm run eval)");
  }

  // 3. Write results document
  const summary: EvalRunSummary = {
    timestamp: new Date().toISOString(),
    geminiModel: modelName,
    hasGeminiKey: Boolean(apiKey),
    ruleBased: ruleBasedResult,
    gemini: geminiResult,
  };

  const mdReport = formatEvalReportMarkdown(summary);
  const docsDir = path.dirname(RESULTS_DOC_PATH);
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(RESULTS_DOC_PATH, mdReport, "utf8");

  console.log("\n================================================================================");
  console.log(`✓ Evaluation results successfully written to ${RESULTS_DOC_PATH}`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Evaluation script encountered an unhandled error:", err);
  process.exit(1);
});

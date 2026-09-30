/**
 * lib/evalMetrics.ts
 *
 * Pure evaluation metric calculation functions for classifier performance:
 * - Accuracy (overall & per language)
 * - Confusion Matrix
 * - Urgency Mean Absolute Error (MAE)
 * - Markdown report formatter
 */

export interface EvalSample {
  id: string;
  synthetic: boolean;
  language: string;
  language_code: string;
  text: string;
  english_translation?: string;
  gold_category: string;
  gold_urgency: number;
}

export interface EvalPrediction {
  id: string;
  language: string;
  language_code: string;
  gold_category: string;
  predicted_category: string;
  gold_urgency: number;
  predicted_urgency: number;
  detected_language?: string;
  classified_by: "gemini" | "rule-based";
}

export interface LanguageAccuracy {
  language: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface ConfusionMatrixResult {
  categories: string[];
  matrix: Record<string, Record<string, number>>;
}

export interface EngineEvalResult {
  engine: "gemini" | "rule-based";
  totalSamples: number;
  overallAccuracy: number;
  urgencyMAE: number;
  perLanguageAccuracy: Record<string, LanguageAccuracy>;
  confusionMatrix: ConfusionMatrixResult;
}

export interface EvalRunSummary {
  timestamp: string;
  geminiModel?: string;
  hasGeminiKey: boolean;
  ruleBased: EngineEvalResult;
  gemini?: EngineEvalResult;
}

/**
 * Compute overall category classification accuracy (0.0 to 1.0).
 */
export function computeAccuracy(records: Array<{ predicted_category: string; gold_category: string }>): number {
  if (records.length === 0) return 0;
  const correct = records.filter(
    (r) => r.predicted_category.trim().toLowerCase() === r.gold_category.trim().toLowerCase()
  ).length;
  return Number((correct / records.length).toFixed(4));
}

/**
 * Compute classification accuracy segmented by language.
 */
export function computeAccuracyPerLanguage(records: EvalPrediction[]): Record<string, LanguageAccuracy> {
  const result: Record<string, LanguageAccuracy> = {};

  for (const rec of records) {
    const lang = rec.language || "Unknown";
    if (!result[lang]) {
      result[lang] = { language: lang, total: 0, correct: 0, accuracy: 0 };
    }
    result[lang].total += 1;
    if (rec.predicted_category.trim().toLowerCase() === rec.gold_category.trim().toLowerCase()) {
      result[lang].correct += 1;
    }
  }

  for (const lang of Object.keys(result)) {
    const entry = result[lang];
    entry.accuracy = entry.total > 0 ? Number((entry.correct / entry.total).toFixed(4)) : 0;
  }

  return result;
}

/**
 * Compute confusion matrix for multiclass category predictions.
 * Rows = Gold (Actual), Columns = Predicted
 */
export function computeConfusionMatrix(
  categories: string[],
  records: Array<{ predicted_category: string; gold_category: string }>
): ConfusionMatrixResult {
  const cats = Array.from(new Set(categories.map((c) => c.toLowerCase()))).sort();
  const matrix: Record<string, Record<string, number>> = {};

  for (const rowCat of cats) {
    matrix[rowCat] = {};
    for (const colCat of cats) {
      matrix[rowCat][colCat] = 0;
    }
  }

  for (const rec of records) {
    const actual = rec.gold_category.toLowerCase();
    const predicted = rec.predicted_category.toLowerCase();
    if (matrix[actual] && matrix[actual][predicted] !== undefined) {
      matrix[actual][predicted] += 1;
    }
  }

  return { categories: cats, matrix };
}

/**
 * Compute Mean Absolute Error (MAE) for urgency predictions (1 to 5 scale).
 */
export function computeUrgencyMAE(records: Array<{ predicted_urgency: number; gold_urgency: number }>): number {
  if (records.length === 0) return 0;
  const totalAbsError = records.reduce((sum, r) => sum + Math.abs(r.predicted_urgency - r.gold_urgency), 0);
  return Number((totalAbsError / records.length).toFixed(4));
}

/**
 * Build engine eval metrics summary from sample predictions.
 */
export function evaluatePredictions(
  engine: "gemini" | "rule-based",
  categories: string[],
  predictions: EvalPrediction[]
): EngineEvalResult {
  const overallAccuracy = computeAccuracy(predictions);
  const urgencyMAE = computeUrgencyMAE(predictions);
  const perLanguageAccuracy = computeAccuracyPerLanguage(predictions);
  const confusionMatrix = computeConfusionMatrix(categories, predictions);

  return {
    engine,
    totalSamples: predictions.length,
    overallAccuracy,
    urgencyMAE,
    perLanguageAccuracy,
    confusionMatrix,
  };
}

/**
 * Formats evaluation results into GitHub-flavored Markdown for docs/eval-results.md.
 */
export function formatEvalReportMarkdown(summary: EvalRunSummary): string {
  const lines: string[] = [];

  lines.push("# Classifier Multilingual Evaluation Results");
  lines.push("");
  lines.push(`**Run Timestamp:** ${summary.timestamp}`);
  lines.push(`**Evaluation Suite:** \`data/eval/complaints_multilingual.jsonl\` (${summary.ruleBased.totalSamples} synthetic multilingual complaints)`);
  lines.push(`**Gemini API Key:** ${summary.hasGeminiKey ? `Configured (\`${summary.geminiModel || "default"}\`)` : "Missing (rule-based fallback only)"}`);
  lines.push("");

  if (!summary.hasGeminiKey) {
    lines.push("> [!NOTE]");
    lines.push("> **GEMINI_API_KEY is missing.** Running evaluation for rule-based fallback only.");
    lines.push("> To evaluate Gemini, configure `GEMINI_API_KEY` in `.env` and rerun `npm run eval`.");
    lines.push("");
  }

  const renderEngineSection = (res: EngineEvalResult, title: string) => {
    lines.push(`## ${title}`);
    lines.push("");
    lines.push(`- **Overall Category Accuracy:** ${(res.overallAccuracy * 100).toFixed(2)}%`);
    lines.push(`- **Urgency MAE:** ${res.urgencyMAE.toFixed(3)} points (1–5 scale)`);
    lines.push(`- **Total Test Samples:** ${res.totalSamples}`);
    lines.push("");

    // Per Language Accuracy Table
    lines.push("### Per-Language Category Accuracy");
    lines.push("");
    lines.push("| Language | Total Samples | Correct | Accuracy (%) |");
    lines.push("| :--- | :---: | :---: | :---: |");
    for (const lang of Object.keys(res.perLanguageAccuracy).sort()) {
      const row = res.perLanguageAccuracy[lang];
      lines.push(`| ${row.language} | ${row.total} | ${row.correct} | ${(row.accuracy * 100).toFixed(1)}% |`);
    }
    lines.push("");

    // Confusion Matrix Table
    lines.push("### Confusion Matrix (Gold Actual vs. Predicted)");
    lines.push("");
    const cats = res.confusionMatrix.categories;
    lines.push(`| Gold \\ Predicted | ${cats.map((c) => c.toUpperCase()).join(" | ")} | Total |`);
    lines.push(`| :--- | ${cats.map(() => ":---:").join(" | ")} | :---: |`);
    for (const actual of cats) {
      const rowVals = cats.map((pred) => res.confusionMatrix.matrix[actual]?.[pred] ?? 0);
      const rowTotal = rowVals.reduce((a, b) => a + b, 0);
      lines.push(`| **${actual.toUpperCase()}** | ${rowVals.join(" | ")} | ${rowTotal} |`);
    }
    lines.push("");
  };

  renderEngineSection(summary.ruleBased, "1. Rule-Based Fallback Classifier");

  if (summary.gemini) {
    renderEngineSection(summary.gemini, `2. Gemini Classifier (${summary.geminiModel || "gemini"})`);
  }

  lines.push("---");
  lines.push("*Generated automatically by `npm run eval` (`scripts/eval-classifier.ts`). Never hand-edited.*");
  lines.push("");

  return lines.join("\n");
}

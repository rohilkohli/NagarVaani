export type ClassificationSource = "gemini" | "rule-based";
export type ClassificationConfidence = "high" | "medium" | "low";

export type ClassificationResult = {
  category: "roads" | "water" | "electricity" | "sanitation" | "health" | "education" | "other";
  urgency: number;
  summary_english: string;
  language_detected: string;
  keywords: string[];
  classified_by: ClassificationSource;
  confidence: ClassificationConfidence;
};

const CATEGORY_KEYWORDS: Record<ClassificationResult["category"], string[]> = {
  roads: [
    "road", "roads", "pothole", "potholes", "pavement", "bridge", "highway", "street", "crater", "asphalt", "traffic",
    "सड़क", "सड़क", "गड्ढा", "गड्ढे", "पुल", "मार्ग", "sadak", "sadke", "gaddha", "gaddhe", "pul", "rasta", "raasta",
  ],
  water: [
    "water", "pipeline", "leak", "leakage", "tap", "paani", "pani", "nal", "jal", "पानी", "नल", "पाइप", "रिसाव",
  ],
  electricity: [
    "electricity", "power", "blackout", "transformer", "voltage", "wiring", "wire", "outage", "bijli", "batti", "बिजली", "विद्युत", "करंट",
  ],
  sanitation: [
    "garbage", "waste", "trash", "sewage", "sewer", "drain", "drainage", "mosquito", "latrine", "toilet", "kachra", "naala", "nala", "gandagi", "safai", "कचरा", "नाला", "सीवर", "मच्छर", "शौचालय",
  ],
  health: [
    "health", "hospital", "clinic", "doctor", "ambulance", "medicine", "disease", "fever", "aspataal", "dawa", "अस्पताल", "डॉक्टर", "दवा", "बीमारी", "एम्बुलेंस",
  ],
  education: [
    "school", "college", "teacher", "classroom", "student", "exam", "education", "shiksha", "vidyalaya", "adhyapak", "स्कूल", "विद्यालय", "शिक्षक", "छात्र",
  ],
  other: [],
};

const CATEGORY_ORDER: ClassificationResult["category"][] = ["roads", "water", "electricity", "sanitation", "health", "education"];

function tokensFor(text: string): Set<string> {
  return new Set((text.toLocaleLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []));
}

export function ruleBasedClassify(text: string): ClassificationResult {
  const cleanText = String(text || "").trim();
  const tokens = tokensFor(cleanText);
  const matches = CATEGORY_ORDER.map((category) => ({
    category,
    keywords: CATEGORY_KEYWORDS[category].filter((keyword) => tokens.has(keyword.toLocaleLowerCase())),
  })).filter((entry) => entry.keywords.length > 0);

  if (matches.length === 0) {
    return {
      category: "other",
      urgency: 3,
      summary_english: cleanText ? cleanText.slice(0, 100) : "Complaint details were not provided.",
      language_detected: "Unknown",
      keywords: ["unclassified"],
      classified_by: "rule-based",
      confidence: "low",
    };
  }

  const winner = matches.sort((left, right) => right.keywords.length - left.keywords.length)[0];
  const urgency = /emergency|danger|death|fatal|collapsed|fire|explosion|flood|poison|outbreak|urgent|hazard|electrocution|आपात|खतरा|बाढ़/.test(cleanText.toLocaleLowerCase()) ? 5 : 3;
  return {
    category: winner.category,
    urgency,
    summary_english: cleanText.slice(0, 100) || "Complaint details were not provided.",
    language_detected: "Unknown",
    keywords: winner.keywords.slice(0, 5),
    classified_by: "rule-based",
    confidence: winner.keywords.length > 1 ? "high" : "medium",
  };
}

export function labelClassification(result: Omit<ClassificationResult, "classified_by" | "confidence"> & Partial<Pick<ClassificationResult, "classified_by" | "confidence">>, source: ClassificationSource, confidence: ClassificationConfidence): ClassificationResult {
  return { ...result, classified_by: source, confidence };
}

export function parseGeminiClassification(raw: string, fallbackText: string): ClassificationResult {
  const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  const validCategories = ["roads", "water", "electricity", "sanitation", "health", "education", "other"];
  const category = String(parsed.category || "").toLowerCase();
  const urgency = Number(parsed.urgency);
  const summary = String(parsed.summary_english || "").trim();
  const language = String(parsed.language_detected || "").trim();
  const keywords = Array.isArray(parsed.keywords) && parsed.keywords.every((keyword: unknown) => typeof keyword === "string")
    ? parsed.keywords.slice(0, 5)
    : [];
  const confidence = parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
    ? parsed.confidence
    : typeof parsed.confidence === "number" && parsed.confidence >= 0.8
      ? "high"
      : typeof parsed.confidence === "number" && parsed.confidence >= 0.5
        ? "medium"
        : "low";
  if (!validCategories.includes(category) || !Number.isInteger(urgency) || urgency < 1 || urgency > 5 || !summary || !language || keywords.length === 0) {
    throw new Error("Gemini classification did not match the expected schema.");
  }
  return {
    category: category as ClassificationResult["category"],
    urgency,
    summary_english: summary,
    language_detected: language,
    keywords,
    classified_by: "gemini",
    confidence,
  };
}

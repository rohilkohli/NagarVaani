import test from "node:test";
import assert from "node:assert/strict";
import { parseGeminiClassification, ruleBasedClassify } from "./classify.ts";

const cases: Array<[string, string]> = [
  ["The road has a pothole", "roads"], ["Gaddha on the sadak", "roads"], ["सड़क पर गड्ढा है", "roads"], ["Bridge pavement is broken", "roads"], ["Highway crater blocks traffic", "roads"],
  ["Water pipeline leak", "water"], ["Paani nahi aa raha", "water"], ["नल में पानी नहीं है", "water"], ["Tap is dry", "water"], ["Jal risav near home", "water"],
  ["Power outage in the neighborhood", "electricity"], ["Bijli ki batti band hai", "electricity"], ["बिजली का तार गिरा है", "electricity"], ["Transformer voltage problem", "electricity"], ["Blackout after wiring fault", "electricity"],
  ["Garbage is overflowing", "sanitation"], ["Kachra and gandagi everywhere", "sanitation"], ["नाला बंद है", "sanitation"], ["Sewage drain smells", "sanitation"], ["Mosquito problem from waste", "sanitation"],
  ["The clinic needs medicine", "health"], ["Aspataal ambulance is late", "health"], ["अस्पताल में डॉक्टर नहीं है", "health"], ["Hospital fever ward", "health"], ["Doctor reports disease outbreak", "health"],
  ["School classroom is unsafe", "education"], ["Shiksha teacher shortage", "education"], ["विद्यालय में शिक्षक नहीं है", "education"], ["Student exam support needed", "education"], ["College education facilities", "education"],
];

test("rule-based classifier covers multilingual category cases", () => {
  assert.equal(cases.length, 30);
  for (const [text, expected] of cases) assert.equal(ruleBasedClassify(text).category, expected, text);
});

test("rule-based matching avoids substring false positives and labels unknown input honestly", () => {
  for (const text of ["My laptop is slow", "Current affairs class", "Tariff increased", "The value is lu", "A tapir is nearby"]) {
    const result = ruleBasedClassify(text);
    assert.equal(result.category, "other", text);
    assert.equal(result.confidence, "low", text);
    assert.equal(result.classified_by, "rule-based");
  }
});

test("malformed Gemini output is rejected and valid output is labeled", () => {
  assert.throws(() => parseGeminiClassification("not json", "complaint"));
  const result = parseGeminiClassification(JSON.stringify({
    category: "water",
    urgency: 4,
    summary_english: "Water supply is interrupted.",
    language_detected: "English",
    keywords: ["water", "supply"],
    confidence: "high",
  }), "complaint");
  assert.equal(result.classified_by, "gemini");
  assert.equal(result.confidence, "high");
});
import test from "node:test";
import assert from "node:assert/strict";

import { detectLanguageFromText, ruleBasedClassify } from "./classify.ts";
import {
  computeAccuracy,
  computeAccuracyPerLanguage,
  computeConfusionMatrix,
  computeUrgencyMAE,
  formatEvalReportMarkdown,
  type EvalPrediction,
} from "./evalMetrics.ts";

test("detectLanguageFromText identifies 10 Indian languages and English correctly", () => {
  // Hindi
  const hi = detectLanguageFromText("हमारे वार्ड में पीने के पानी की गंभीर समस्या है।");
  assert.equal(hi.code, "hi");
  assert.equal(hi.name, "Hindi");

  // Marathi (Devanagari with Marathi lexical marker 'आहे' / 'पाण्याचा' / 'रस्ता')
  const mr = detectLanguageFromText("आमच्या गावात पिण्याच्या पाण्याची मोठी टंचाई आहे आणि रस्ता खराब झाला आहे.");
  assert.equal(mr.code, "mr");
  assert.equal(mr.name, "Marathi");

  // Bengali
  const bn = detectLanguageFromText("আমাদের পাড়ায় তিন দিন ধরে নলকূপ খারাপ হয়ে আছে, পানীয় জল নেই।");
  assert.equal(bn.code, "bn");
  assert.equal(bn.name, "Bengali");

  // Tamil
  const ta = detectLanguageFromText("எங்கள் தெருவில் குழாய் உடைந்து குடிநீர் வீணாகிறது, அவசரமாக சரிசெய்யவும்.");
  assert.equal(ta.code, "ta");
  assert.equal(ta.name, "Tamil");

  // Telugu
  const te = detectLanguageFromText("మా వీధిలో పైపులైను పగిలి తాగునీరు రోడ్డుపై వృథాగా పోతోంది.");
  assert.equal(te.code, "te");
  assert.equal(te.name, "Telugu");

  // Gujarati
  const gu = detectLanguageFromText("અમારા વિસ્તારમાં પાણીની પાઈપલાઈનમાં મોટું લીકેજ છે અને પાણી નથી આવતું.");
  assert.equal(gu.code, "gu");
  assert.equal(gu.name, "Gujarati");

  // Kannada
  const kn = detectLanguageFromText("ನಮ್ಮ ಬಡಾವಣೆಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ರಸ್ತೆಯಲ್ಲೆಲ್ಲ ನೀರು ಹರಿಯುತ್ತಿದೆ.");
  assert.equal(kn.code, "kn");
  assert.equal(kn.name, "Kannada");

  // Malayalam
  const ml = detectLanguageFromText("ഞങ്ങളുടെ പ്രദേശത്ത് കുടിവെള്ള പൈപ്പ് പൊട്ടി വെള്ളം പാഴാകുന്നു, ഉടൻ പരിഹരിക്കുക.");
  assert.equal(ml.code, "ml");
  assert.equal(ml.name, "Malayalam");

  // Punjabi
  const pa = detectLanguageFromText("ਸਾਡੀ ਗਲੀ ਵਿੱਚ ਪਾਣੀ ਵਾਲੀ ਪਾਈਪ ਲੀਕ ਹੋ ਰਹੀ ਹੈ ਅਤੇ ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਨਹੀਂ ਆ ਰਿਹਾ।");
  assert.equal(pa.code, "pa");
  assert.equal(pa.name, "Punjabi");

  // Odia
  const or = detectLanguageFromText("ଆମ ଗାଁରେ ପିଇବା ପାଣି ପାଇପ୍ ଫାଟି ଯାଇଛି ଏବଂ ଜଳ ଯୋଗାଣ ବନ୍ଦ ଅଛି।");
  assert.equal(or.code, "or");
  assert.equal(or.name, "Odia");

  // English
  const en = detectLanguageFromText("Severe water pipeline leakage on MG Road causing water cut for two days.");
  assert.equal(en.code, "en");
  assert.equal(en.name, "English");

  // Empty fallback to English
  const empty = detectLanguageFromText("");
  assert.equal(empty.code, "en");
});

test("ruleBasedClassify detects correct category and extracts urgency for multilingual text", () => {
  const result = ruleBasedClassify("અમારા વિસ્તારમાં પાણીની પાઈપલાઈનમાં મોટું લીકેજ છે");
  assert.equal(result.category, "water");
  assert.equal(result.language_detected, "Gujarati");
  assert.ok(result.english_translation);

  const urgentResult = ruleBasedClassify("High voltage transformer sparking danger of fire and electrocution emergency");
  assert.equal(urgentResult.category, "electricity");
  assert.equal(urgentResult.urgency, 5);
});

test("computeAccuracy calculates exact accuracy and handles empty lists", () => {
  const sampleData: EvalPrediction[] = [
    { id: "1", text: "a", language: "Hindi", gold_category: "roads", predicted_category: "roads", gold_urgency: 4, predicted_urgency: 4 },
    { id: "2", text: "b", language: "Hindi", gold_category: "water", predicted_category: "water", gold_urgency: 3, predicted_urgency: 3 },
    { id: "3", text: "c", language: "Tamil", gold_category: "electricity", predicted_category: "roads", gold_urgency: 5, predicted_urgency: 3 },
    { id: "4", text: "d", language: "Tamil", gold_category: "health", predicted_category: "health", gold_urgency: 2, predicted_urgency: 2 },
  ];

  // 3 correct out of 4 = 0.75 (75%)
  assert.equal(computeAccuracy(sampleData), 0.75);

  // Empty list returns 0
  assert.equal(computeAccuracy([]), 0);
});

test("computeAccuracyPerLanguage groups accuracy per language accurately", () => {
  const sampleData: EvalPrediction[] = [
    { id: "1", text: "a", language: "Hindi", gold_category: "roads", predicted_category: "roads", gold_urgency: 4, predicted_urgency: 4 },
    { id: "2", text: "b", language: "Hindi", gold_category: "water", predicted_category: "water", gold_urgency: 3, predicted_urgency: 3 },
    { id: "3", text: "c", language: "Tamil", gold_category: "electricity", predicted_category: "roads", gold_urgency: 5, predicted_urgency: 3 },
    { id: "4", text: "d", language: "Tamil", gold_category: "health", predicted_category: "health", gold_urgency: 2, predicted_urgency: 2 },
  ];

  const perLang = computeAccuracyPerLanguage(sampleData);
  assert.equal(perLang.Hindi.total, 2);
  assert.equal(perLang.Hindi.correct, 2);
  assert.equal(perLang.Hindi.accuracy, 1);

  assert.equal(perLang.Tamil.total, 2);
  assert.equal(perLang.Tamil.correct, 1);
  assert.equal(perLang.Tamil.accuracy, 0.5);
});

test("computeConfusionMatrix builds valid 2D frequency matrix", () => {
  const sampleData: EvalPrediction[] = [
    { id: "1", text: "a", language: "Hindi", gold_category: "roads", predicted_category: "roads", gold_urgency: 4, predicted_urgency: 4 },
    { id: "2", text: "b", language: "Tamil", gold_category: "electricity", predicted_category: "roads", gold_urgency: 5, predicted_urgency: 3 },
  ];

  const categories = ["roads", "water", "electricity"];
  const result = computeConfusionMatrix(categories, sampleData);

  // gold roads -> predicted roads: 1
  assert.equal(result.matrix.roads.roads, 1);
  // gold electricity -> predicted roads: 1
  assert.equal(result.matrix.electricity.roads, 1);
  // gold water -> predicted roads: 0
  assert.equal(result.matrix.water.roads, 0);
});

test("computeUrgencyMAE computes correct Mean Absolute Error", () => {
  const sampleData: EvalPrediction[] = [
    { id: "1", text: "a", language: "Hindi", gold_category: "roads", predicted_category: "roads", gold_urgency: 4, predicted_urgency: 5 }, // |4-5| = 1
    { id: "2", text: "b", language: "Hindi", gold_category: "water", predicted_category: "water", gold_urgency: 3, predicted_urgency: 1 }, // |3-1| = 2
    { id: "3", text: "c", language: "Tamil", gold_category: "health", predicted_category: "health", gold_urgency: 5, predicted_urgency: 5 }, // |5-5| = 0
  ];

  // MAE = (1 + 2 + 0) / 3 = 1.00
  assert.equal(computeUrgencyMAE(sampleData), 1.0);
  assert.equal(computeUrgencyMAE([]), 0);
});

test("formatEvalReportMarkdown generates properly formatted markdown table", () => {
  const sampleData: EvalPrediction[] = [
    { id: "1", text: "a", language: "Hindi", gold_category: "roads", predicted_category: "roads", gold_urgency: 4, predicted_urgency: 4 },
    { id: "2", text: "b", language: "Bengali", gold_category: "water", predicted_category: "water", gold_urgency: 3, predicted_urgency: 3 },
  ];

  const cats = ["roads", "water"];
  const matrix = computeConfusionMatrix(cats, sampleData);
  const perLang = computeAccuracyPerLanguage(sampleData);

  const report = formatEvalReportMarkdown({
    timestamp: new Date().toISOString(),
    geminiModel: "gemini-2.5-flash",
    hasGeminiKey: false,
    ruleBased: {
      engine: "rule-based",
      totalSamples: 2,
      overallAccuracy: 1,
      urgencyMAE: 0,
      perLanguageAccuracy: perLang,
      confusionMatrix: matrix,
    },
    gemini: null,
  });

  assert.ok(report.includes("# Classifier Multilingual Evaluation Results"));
  assert.ok(report.includes("Rule-Based Fallback Classifier"));
  assert.ok(report.includes("Hindi"));
  assert.ok(report.includes("Bengali"));
  assert.ok(report.includes("100.00%"));
});

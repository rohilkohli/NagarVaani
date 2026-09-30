# Classifier Multilingual Evaluation Results

**Run Timestamp:** 2026-09-30T09:18:55.437Z
**Evaluation Suite:** `data/eval/complaints_multilingual.jsonl` (60 synthetic multilingual complaints)
**Gemini API Key:** Missing (rule-based fallback only)

> [!NOTE]
> **GEMINI_API_KEY is missing.** Running evaluation for rule-based fallback only.
> To evaluate Gemini, configure `GEMINI_API_KEY` in `.env` and rerun `npm run eval`.

## 1. Rule-Based Fallback Classifier

- **Overall Category Accuracy:** 95.00%
- **Urgency MAE:** 0.933 points (1–5 scale)
- **Total Test Samples:** 60

### Per-Language Category Accuracy

| Language | Total Samples | Correct | Accuracy (%) |
| :--- | :---: | :---: | :---: |
| Bengali | 6 | 6 | 100.0% |
| Gujarati | 6 | 6 | 100.0% |
| Hindi | 6 | 6 | 100.0% |
| Kannada | 6 | 6 | 100.0% |
| Malayalam | 6 | 6 | 100.0% |
| Marathi | 6 | 5 | 83.3% |
| Odia | 6 | 6 | 100.0% |
| Punjabi | 6 | 6 | 100.0% |
| Tamil | 6 | 6 | 100.0% |
| Telugu | 6 | 4 | 66.7% |

### Confusion Matrix (Gold Actual vs. Predicted)

| Gold \ Predicted | EDUCATION | ELECTRICITY | HEALTH | OTHER | ROADS | SANITATION | WATER | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **EDUCATION** | 8 | 0 | 0 | 1 | 0 | 0 | 1 | 10 |
| **ELECTRICITY** | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 10 |
| **HEALTH** | 0 | 0 | 9 | 1 | 0 | 0 | 0 | 10 |
| **OTHER** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **ROADS** | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 10 |
| **SANITATION** | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 10 |
| **WATER** | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 10 |

---
*Generated automatically by `npm run eval` (`scripts/eval-classifier.ts`). Never hand-edited.*

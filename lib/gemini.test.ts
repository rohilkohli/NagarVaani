import test from "node:test";
import assert from "node:assert/strict";
import { chooseGeminiModel } from "./gemini.ts";

test("Gemini model selection uses configured model or an available Flash fallback", () => {
  assert.deepEqual(chooseGeminiModel("custom-flash", ["models/custom-flash"]), { model: "custom-flash", usedFallback: false });
  assert.deepEqual(chooseGeminiModel("missing", ["models/gemini-2.5-flash"]), { model: "gemini-2.5-flash", usedFallback: true });
});
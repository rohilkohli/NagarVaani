import test from "node:test";
import assert from "node:assert/strict";
import { transcribeAudio } from "./transcribe.ts";

test("transcribes audio through the shared Gemini path", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  let receivedData = "";
  const client = {
    models: {
      generateContent: async (request: any) => {
        receivedData = request.contents[0].parts[0].inlineData.data;
        return {
          text: JSON.stringify({
            original_text: "पानी नहीं है",
            english_translation: "There is no water",
            language_detected: "Hindi",
            confidence: 0.91,
          }),
        };
      },
    },
  };

  const result = await transcribeAudio(Buffer.from("audio-bytes"), "audio/ogg", client as any);
  assert.equal(receivedData, Buffer.from("audio-bytes").toString("base64"));
  assert.equal(result.english_translation, "There is no water");
  assert.equal(result.language_detected, "Hindi");
});
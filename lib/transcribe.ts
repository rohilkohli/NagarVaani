import { getGeminiClient, getGeminiModelName } from "./gemini.ts";

export type TranscriptionResult = {
  original_text: string;
  english_translation: string;
  language_detected: string;
  confidence: number;
};

export async function transcribeAudio(buffer: Buffer, mimeType = "audio/webm", client: any = getGeminiClient()): Promise<TranscriptionResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await client.models.generateContent({
    model: getGeminiModelName(),
    contents: [{
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: mimeType.startsWith("audio/") ? mimeType : "audio/webm",
            data: buffer.toString("base64"),
          },
        },
        {
          text: `Transcribe this audio recording exactly as spoken. Then translate it to English if it is not already in English. Return JSON strictly in this format:\n{"original_text":"exact transcription in original language","english_translation":"English translation","language_detected":"language name","confidence":0.95}`,
        },
      ],
    }],
    config: { responseMimeType: "application/json" },
  });

  const raw = response.text || "{}";
  const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  return {
    original_text: String(parsed.original_text || ""),
    english_translation: String(parsed.english_translation || parsed.original_text || ""),
    language_detected: String(parsed.language_detected || "English"),
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
  };
}

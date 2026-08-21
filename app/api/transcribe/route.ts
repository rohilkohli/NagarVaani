import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | File | null;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: "Missing audio file in request formData ('audio')" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert audio file / blob to Buffer and Base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    const prompt = `Transcribe this audio recording exactly as spoken. 
Then translate it to English if it is not already in English.
Return JSON strictly in this format:
{
  "original_text": "exact transcription in original language",
  "english_translation": "English translation",
  "language_detected": "language name",
  "confidence": 0.95
}`;

    // Call Gemini 3.7 Flash with audio/webm mime type in inlineData
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType.startsWith("audio/") ? mimeType : "audio/webm",
                data: base64Audio,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let parsedData;

    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      // Fallback clean markdown code block if needed
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    return new Response(
      JSON.stringify({
        original_text: parsedData.original_text || "",
        english_translation: parsedData.english_translation || parsedData.original_text || "",
        language_detected: parsedData.language_detected || "English",
        confidence: typeof parsedData.confidence === "number" ? parsedData.confidence : 0.95,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Transcription API Error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to transcribe audio",
        original_text: "",
        english_translation: "",
        language_detected: "Unknown",
        confidence: 0,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

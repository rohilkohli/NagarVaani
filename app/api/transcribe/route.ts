import { jsonResponse, getErrorMessage } from "@/lib/api";
import { transcribeAudio } from "@/lib/transcribe";

const transcriptionRequests = new Map<string, { count: number; windowStart: number }>();
const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
const MAX_AUDIO_DURATION_SECONDS = 5 * 60;
const ALLOWED_AUDIO_TYPES = new Set(["audio/ogg", "audio/mpeg", "audio/mp4"]);

export async function POST(req: Request) {
  try {
    const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const now = Date.now();
    const existing = transcriptionRequests.get(clientKey);
    if (!existing || now - existing.windowStart >= 60 * 60 * 1000) {
      transcriptionRequests.set(clientKey, { count: 1, windowStart: now });
    } else if (existing.count >= 20) {
      return jsonResponse({ success: false, error: "Transcription rate limit exceeded." }, 429);
    } else {
      existing.count += 1;
    }
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | File | null;

    if (!audioFile) {
      return jsonResponse({ success: false, error: "Missing audio file in request formData ('audio')" }, 400);
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return jsonResponse({ success: false, error: "Audio file must be 16 MB or smaller." }, 413);
    }
    const mimeType = (audioFile.type || "").split(";", 1)[0].toLowerCase();
    if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
      return jsonResponse({ success: false, error: "Unsupported audio content type." }, 415);
    }
    const duration = Number(formData.get("duration_seconds") || 0);
    if (duration && (!Number.isFinite(duration) || duration > MAX_AUDIO_DURATION_SECONDS)) {
      return jsonResponse({ success: false, error: "Audio duration must be 5 minutes or less." }, 400);
    }

    if (!process.env.GEMINI_API_KEY) {
      return jsonResponse({
        error: "GEMINI_API_KEY is not configured.",
        original_text: "",
        english_translation: "",
        language_detected: "Unknown",
        confidence: 0,
      }, 500);
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsedData = await transcribeAudio(buffer, mimeType);

    return jsonResponse({
      original_text: parsedData.original_text || "",
      english_translation: parsedData.english_translation || parsedData.original_text || "",
      language_detected: parsedData.language_detected || "English",
      confidence: typeof parsedData.confidence === "number" ? parsedData.confidence : 0.95,
    });
  } catch (error: any) {
    console.error("Transcription API Error:", error);
    return jsonResponse({
      error: getErrorMessage(error),
      original_text: "",
      english_translation: "",
      language_detected: "Unknown",
      confidence: 0,
    }, 500);
  }
}
